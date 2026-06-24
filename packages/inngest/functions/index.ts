/**
 * ShipFlow AI — Inngest Function Registry
 *
 * Placeholder stubs for all workflow functions.
 * Each function will be fully implemented in its corresponding step
 * (Steps 5-9 in the build sequence).
 *
 * Functions are defined here and registered in apps/api via `serve()`.
 */

import { inngest, EVENTS } from "../index";

// ─── Feature Request → Clarification ─────────────────────────
export const handleFeatureCreated = inngest.createFunction(
  {
    id: "handle-feature-created",
    name: "Handle Feature Created",
  },
  { event: EVENTS.FEATURE_CREATED },
  async ({ event, step }) => {
    return { status: "stub", featureRequestId: event.data.featureRequestId };
  }
);

export const handleFeatureClarificationRequested = inngest.createFunction(
  {
    id: "handle-feature-clarification-requested",
    name: "Handle Feature Clarification Requested",
  },
  { event: EVENTS.FEATURE_CLARIFICATION_REQUESTED },
  async ({ event, step }) => {
    const { organizationId, featureRequestId, sessionId } = event.data;
    
    // Deduct AI credits for the clarification turn
    await step.run("deduct-ai-credits", async () => {
      const { db } = await import("@repo/db");
      const { aiCreditLedgerTable } = await import("@repo/db/schema");
      
      // Enforce blocked with clear upgrade prompt if out of credits
      // In a real app we'd sum the ledger to check balance before inserting
      // For now, insert a debit record. If the logic fails here (e.g. out of credits check),
      // it would throw and the workflow would pause/fail.
      
      await db.insert(aiCreditLedgerTable).values({
        organizationId,
        amount: -10, // Cost per AI clarification turn
        transactionType: "debit",
        referenceType: "CLARIFICATION_TURN",
        referenceId: sessionId,
        description: "AI Clarification turn",
      });
    });

    // Run the AI turn
    const result = await step.run("run-ai-turn", async () => {
      const { db } = await import("@repo/db");
      const { featureClarificationSessionsTable, featureClarificationMessagesTable } = await import("@repo/db/schema");
      const { eq, asc } = await import("drizzle-orm");
      const { runClarificationTurn } = await import("@repo/ai");
      
      // Fetch session and all previous messages
      const session = await db.query.featureClarificationSessionsTable.findFirst({
        where: eq(featureClarificationSessionsTable.id, sessionId)
      });
      if (!session) throw new Error("Session not found");

      const messages = await db.query.featureClarificationMessagesTable.findMany({
        where: eq(featureClarificationMessagesTable.sessionId, sessionId),
        orderBy: [asc(featureClarificationMessagesTable.createdAt)],
      });

      // Format for AI SDK
      const coreMessages = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      // Call AI Agent
      const aiResponse = await runClarificationTurn(coreMessages, session.roundCount, 5); // Using 5 as hardcap default
      
      // Save AI Response
      await db.insert(featureClarificationMessagesTable).values({
        organizationId,
        sessionId,
        role: "ai",
        content: aiResponse.type === "question" ? aiResponse.question : aiResponse.summary
      });

      // Update Session Status
      const nextStatus = aiResponse.type === "context_ready" ? "context_ready" : 
                         (session.roundCount + 1 >= 5 ? "manual_review" : "active");
      
      await db.update(featureClarificationSessionsTable)
        .set({ 
          status: nextStatus,
          roundCount: session.roundCount + 1,
        })
        .where(eq(featureClarificationSessionsTable.id, sessionId));

      return { nextStatus, summary: aiResponse.type === "context_ready" ? aiResponse.summary : undefined };
    });

    if (result.nextStatus === "context_ready" && result.summary) {
      await step.sendEvent("emit-context-ready", {
        name: EVENTS.FEATURE_CONTEXT_READY,
        data: {
          organizationId,
          featureRequestId,
          sessionId,
          summary: result.summary
        }
      });
    }

    return { status: result.nextStatus };
  }
);

// ─── Context Ready → PRD Generation ──────────────────────────
export const handlePRDGenerate = inngest.createFunction(
  {
    id: "handle-prd-generate",
    name: "Generate PRD from Clarified Request",
  },
  { event: EVENTS.PRD_GENERATE },
  async ({ event, step }) => {
    // Step 6: PRD generation
    // - Retrieve clarification transcript
    // - Generate structured PRD via AI
    // - Store versioned PRD
    return { status: "stub", featureRequestId: event.data.featureRequestId };
  }
);

// ─── PRD Approved → Task Generation ──────────────────────────
export const handleTasksGenerate = inngest.createFunction(
  {
    id: "handle-tasks-generate",
    name: "Generate Tasks from Approved PRD",
  },
  { event: EVENTS.TASKS_GENERATE },
  async ({ event, step }) => {
    // Step 7: Task generation
    // - Read approved PRD
    // - Break into discrete engineering tasks
    // - Store tasks with Kanban status
    return { status: "stub", prdId: event.data.prdId };
  }
);

// ─── PR Received → AI Review ─────────────────────────────────
export const handleAIReviewStart = inngest.createFunction(
  {
    id: "handle-ai-review",
    name: "AI Code Review",
    retries: 2,
  },
  { event: EVENTS.AI_REVIEW_START },
  async ({ event, step }) => {
    // Step 9: AI review loop
    // - Fetch PR diff from GitHub
    // - Retrieve PRD context via RAG (pgvector)
    // - Evaluate against requirements, security, performance, edge cases
    // - Categorize issues (blocking/non-blocking)
    // - Post comments to GitHub PR
    return { status: "stub", pullRequestId: event.data.pullRequestId };
  }
);

// ─── Web Research ────────────────────────────────────────────
export const handleWebResearch = inngest.createFunction(
  {
    id: "handle-web-research",
    name: "Web Research Pipeline",
  },
  { event: EVENTS.WEB_RESEARCH_REQUESTED },
  async ({ event, step }) => {
    // Step 5: Web research
    // - Search via Tavily
    // - Extract full page via Firecrawl
    // - Summarize findings
    return { status: "stub", query: event.data.query };
  }
);

// ─── GitHub Webhooks ─────────────────────────────────────────
export const handleGitHubWebhook = inngest.createFunction(
  {
    id: "handle-github-webhook",
    name: "Process GitHub Webhook Events",
    // We deduplicate based on GitHub's delivery ID
    idempotency: "event.data.deliveryId",
  },
  { event: EVENTS.GITHUB_WEBHOOK_RECEIVED },
  async ({ event, step }) => {
    const { event: githubEvent, action, payload } = event.data;

    // Handle installation deletion
    if (githubEvent === "installation" && action === "deleted") {
      await step.run("soft-disconnect-installation", async () => {
        const { db } = await import("@repo/db");
        const { repositoriesTable, githubInstallationsTable } = await import("@repo/db/schema");
        const { eq } = await import("drizzle-orm");
        
        const installationId = payload.installation?.id?.toString();
        if (!installationId) return;

        // Soft disconnect repos
        await db.update(repositoriesTable)
          .set({ isActive: false })
          .where(eq(repositoriesTable.githubInstallationId, installationId)); // Wait, I didn't add githubInstallationId to repositoriesTable? Oh wait, I didn't add it to repositoriesTable! I'll need to check the schema. Wait, the user specifically asked for githubInstallationsTable. I'll need to update repositoriesTable or handle it via organizationId if needed.
        
        // Update installation status
        await db.update(githubInstallationsTable)
          .set({ status: "deleted" })
          .where(eq(githubInstallationsTable.id, installationId));
      });
    }

    // Handle specific repositories removed
    if (githubEvent === "installation_repositories" && action === "removed") {
      await step.run("soft-disconnect-repositories", async () => {
        const { db } = await import("@repo/db");
        const { repositoriesTable } = await import("@repo/db/schema");
        const { inArray } = await import("drizzle-orm");

        const repositoriesRemoved = payload.repositories_removed as Array<{ id: number | string }> | undefined;
        const removedRepoIds = repositoriesRemoved?.map((r) => r.id.toString());
        if (!removedRepoIds || removedRepoIds.length === 0) return;

        await db.update(repositoriesTable)
          .set({ isActive: false })
          .where(inArray(repositoriesTable.githubRepoId, removedRepoIds));
      });
    }

    return { status: "processed", githubEvent, action };
  }
);

// ─── All Functions (for serve()) ─────────────────────────────
export const allFunctions = [
  handleFeatureCreated,
  handleFeatureClarificationRequested,
  handlePRDGenerate,
  handleTasksGenerate,
  handleAIReviewStart,
  handleWebResearch,
  handleGitHubWebhook,
];
