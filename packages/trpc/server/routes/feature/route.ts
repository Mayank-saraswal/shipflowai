import { z } from "zod";
import { organizationProcedure, router } from "../../trpc";
import { db } from "@repo/db";
import { 
  featureRequestsTable, 
  featureClarificationSessionsTable, 
  featureClarificationMessagesTable,
  embeddingsTable,
  aiCreditLedgerTable,
  subscriptionsTable
} from "@repo/db/schema";
import { eq, and, desc, sql, sum } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { embed } from "@repo/ai";
import { getEmbeddingModel } from "@repo/ai";
import { inngest } from "@repo/inngest";
import { EVENTS } from "@repo/events";

export const featureRouter = router({
  submitInitial: organizationProcedure
    .input(
      z.object({
        projectId: z.string(),
        text: z.string().min(10, "Please provide a bit more detail.").max(5000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 1. Rate Limiting Check
      const subscription = await db.query.subscriptionsTable.findFirst({
        where: eq(subscriptionsTable.organizationId, ctx.organizationId)
      });
      const plan = subscription?.plan || "free";
      const limits: Record<string, number> = { free: 10, pro: 100, enterprise: 1000 };
      const limit = limits[plan] || 10;

      const countRow = (await db.select({ count: sql<number>`count(*)` })
        .from(featureRequestsTable)
        .where(eq(featureRequestsTable.organizationId, ctx.organizationId)))[0];
      
      if (Number(countRow?.count || 0) >= limit) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: `You have reached your feature request limit for the ${plan} plan.` });
      }

      // 2. AI Credit Check
      const balanceRow = (await db.select({ balance: sum(aiCreditLedgerTable.amount) })
        .from(aiCreditLedgerTable)
        .where(eq(aiCreditLedgerTable.organizationId, ctx.organizationId)))[0];
      
      if (Number(balanceRow?.balance || 0) < 5) {
        throw new TRPCError({ code: "PAYMENT_REQUIRED", message: "Insufficient AI credits. Please upgrade your plan." });
      }

      // 3. Lightweight Moderation (heuristic)
      if (/(viagra|casino|crypto)/i.test(input.text) || input.text.split("").every(c => c === input.text[0])) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Your request was flagged by our moderation system." });
      }

      // 4. Generate Embeddings & Deduct Credits
      const embeddingModel = getEmbeddingModel();
      const { embedding } = await embed({
        model: embeddingModel,
        value: input.text,
      });

      await db.insert(aiCreditLedgerTable).values({
        organizationId: ctx.organizationId,
        amount: -1, // Cost for embedding
        transactionType: "debit",
        referenceType: "EMBEDDING_GENERATION",
        description: "Feature request initial embedding",
      });

      // 5. Similarity Search
      // cosine distance is <=>, similarity is 1 - <=>
      const similarity = sql`1 - (${embeddingsTable.embedding} <=> ${JSON.stringify(embedding)}::vector)`;
      const matches = await db.select({
        id: embeddingsTable.sourceId,
        similarity: similarity,
      })
      .from(embeddingsTable)
      .where(
        and(
          eq(embeddingsTable.organizationId, ctx.organizationId),
          eq(embeddingsTable.sourceType, "PRD") // or Feature
        )
      )
      .orderBy(desc(similarity))
      .limit(5);

      const strongMatches = matches.filter(m => (m.similarity as number) >= 0.75);

      // 6. Create feature_requests row immediately
      const [featureRequest] = await db.insert(featureRequestsTable).values({
        organizationId: ctx.organizationId,
        projectId: input.projectId,
        title: input.text.slice(0, 50) + (input.text.length > 50 ? "..." : ""),
        description: input.text,
        status: "pending_duplicate_check",
        createdBy: ctx.user.id,
      }).returning();

      if (!featureRequest) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create feature request." });

      // Store embedding
      await db.insert(embeddingsTable).values({
        organizationId: ctx.organizationId,
        sourceType: "FeatureRequest",
        sourceId: featureRequest.id,
        contentChunk: input.text,
        embedding: embedding,
      });

      if (strongMatches.length > 0) {
        return { 
          duplicateCheckRequired: true, 
          featureRequestId: featureRequest.id,
          matches: strongMatches 
        };
      }

      // 7. No matches -> Start Session
      await db.update(featureRequestsTable)
        .set({ status: "open" })
        .where(eq(featureRequestsTable.id, featureRequest.id));

      const [session] = await db.insert(featureClarificationSessionsTable).values({
        organizationId: ctx.organizationId,
        featureRequestId: featureRequest.id,
        status: "awaiting_ai_response",
      }).returning();

      if (!session) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create session." });

      await db.insert(featureClarificationMessagesTable).values({
        organizationId: ctx.organizationId,
        sessionId: session.id,
        role: "user",
        content: input.text,
      });

      await inngest.send({
        name: EVENTS.FEATURE_CLARIFICATION_REQUESTED,
        data: {
          organizationId: ctx.organizationId,
          featureRequestId: featureRequest.id,
          sessionId: session.id,
        }
      });

      return { duplicateCheckRequired: false, sessionId: session.id };
    }),

  submitMatchDecision: organizationProcedure
    .input(
      z.object({
        featureRequestId: z.string(),
        decision: z.enum(["genuinely_different", "confirmed_duplicate"]),
        duplicateOfId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const featureRequest = await db.query.featureRequestsTable.findFirst({
        where: and(
          eq(featureRequestsTable.organizationId, ctx.organizationId),
          eq(featureRequestsTable.id, input.featureRequestId)
        )
      });

      if (!featureRequest) throw new TRPCError({ code: "NOT_FOUND" });

      if (input.decision === "confirmed_duplicate") {
        if (!input.duplicateOfId) throw new TRPCError({ code: "BAD_REQUEST", message: "Must provide duplicateOfId" });
        
        await db.update(featureRequestsTable)
          .set({ 
            duplicateDecision: input.decision,
            duplicateOfFeatureRequestId: input.duplicateOfId,
            status: "closed"
          })
          .where(eq(featureRequestsTable.id, input.featureRequestId));
        
        return { action: "redirect", targetId: input.duplicateOfId };
      }

      // Genuinely different
      await db.update(featureRequestsTable)
        .set({ 
          duplicateDecision: input.decision,
          status: "open" 
        })
        .where(eq(featureRequestsTable.id, input.featureRequestId));

      const [session] = await db.insert(featureClarificationSessionsTable).values({
        organizationId: ctx.organizationId,
        featureRequestId: input.featureRequestId,
        status: "awaiting_ai_response",
      }).returning();

      if (!session) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create session." });

      await db.insert(featureClarificationMessagesTable).values({
        organizationId: ctx.organizationId,
        sessionId: session.id,
        role: "user",
        content: featureRequest.description || featureRequest.title,
      });

      await inngest.send({
        name: EVENTS.FEATURE_CLARIFICATION_REQUESTED,
        data: {
          organizationId: ctx.organizationId,
          featureRequestId: input.featureRequestId,
          sessionId: session.id,
        }
      });

      return { action: "clarify", sessionId: session.id };
    }),

  submitMessage: organizationProcedure
    .input(
      z.object({
        sessionId: z.string(),
        content: z.string().min(1).max(5000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const session = await db.query.featureClarificationSessionsTable.findFirst({
        where: and(
          eq(featureClarificationSessionsTable.organizationId, ctx.organizationId),
          eq(featureClarificationSessionsTable.id, input.sessionId)
        )
      });

      if (!session) throw new TRPCError({ code: "NOT_FOUND" });
      
      // Guard against concurrent submits
      if (session.status === "awaiting_ai_response") {
        throw new TRPCError({ code: "CONFLICT", message: "AI is already responding to the previous message." });
      }
      if (session.status === "context_ready" || session.status === "manual_review") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Session is no longer active." });
      }

      await db.insert(featureClarificationMessagesTable).values({
        organizationId: ctx.organizationId,
        sessionId: session.id,
        role: "user",
        content: input.content,
      });

      await db.update(featureClarificationSessionsTable)
        .set({ status: "awaiting_ai_response" })
        .where(eq(featureClarificationSessionsTable.id, session.id));

      await inngest.send({
        name: EVENTS.FEATURE_CLARIFICATION_REQUESTED,
        data: {
          organizationId: ctx.organizationId,
          featureRequestId: session.featureRequestId,
          sessionId: session.id,
        }
      });

      return { success: true };
    }),

  getSession: organizationProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const session = await db.query.featureClarificationSessionsTable.findFirst({
        where: and(
          eq(featureClarificationSessionsTable.organizationId, ctx.organizationId),
          eq(featureClarificationSessionsTable.id, input.sessionId)
        )
      });

      if (!session) throw new TRPCError({ code: "NOT_FOUND" });

      const messages = await db.query.featureClarificationMessagesTable.findMany({
        where: eq(featureClarificationMessagesTable.sessionId, session.id),
        orderBy: [desc(featureClarificationMessagesTable.createdAt)], // Returning newest first usually better, but UI can sort
      });

      return { session, messages: messages.reverse() }; // Return chronological
    }),
});
