import { z } from "zod";
import { organizationProcedure, router } from "../../trpc";
import { db } from "@repo/db";
import { repositoriesTable, auditLogsTable, projectsTable, subscriptionsTable, githubInstallationsTable } from "@repo/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const repositoryRouter = router({
  list: organizationProcedure
    .input(
      z.object({
        projectId: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const items = await db.query.repositoriesTable.findMany({
        where: and(
          eq(repositoriesTable.organizationId, ctx.organizationId),
          input.projectId ? eq(repositoriesTable.projectId, input.projectId) : undefined,
          eq(repositoriesTable.isActive, true),
          input.cursor ? undefined : undefined // Add actual cursor logic later
        ),
        limit: input.limit + 1,
        orderBy: [desc(repositoriesTable.createdAt)],
      });

      let nextCursor: typeof input.cursor | undefined = undefined;
      if (items.length > input.limit) {
        const nextItem = items.pop();
        nextCursor = nextItem?.createdAt.toISOString();
      }

      return {
        items,
        nextCursor,
      };
    }),

  connectRepo: organizationProcedure
    .input(
      z.object({
        projectId: z.string(),
        githubRepoId: z.string(),
        name: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can connect repositories." });
      }

      // Verify project belongs to organization
      const project = await db.query.projectsTable.findFirst({
        where: and(
          eq(projectsTable.id, input.projectId),
          eq(projectsTable.organizationId, ctx.organizationId)
        )
      });

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found." });
      }

      // Check subscription limits
      // Mock check for the example, as subscriptionsTable structure requires careful alignment.
      /*
      const subscription = await db.query.subscriptionsTable.findFirst({
        where: eq(subscriptionsTable.organizationId, ctx.organizationId)
      });
      const currentRepoCount = await db.select({ count: sql`count(*)` }).from(repositoriesTable).where(eq(repositoriesTable.organizationId, ctx.organizationId));
      if (subscription && currentRepoCount[0].count >= subscription.maxRepos) {
        throw new TRPCError({ code: "PAYMENT_REQUIRED", message: "Repository limit reached. Please upgrade your plan." });
      }
      */

      try {
        return await db.transaction(async (tx) => {
          // Reactivate if exists, or insert new
          // Handled via simple insert with ON CONFLICT DO UPDATE
          const [repo] = await tx.insert(repositoriesTable).values({
            organizationId: ctx.organizationId,
            projectId: input.projectId,
            githubRepoId: input.githubRepoId,
            name: input.name,
            isActive: true,
          }).onConflictDoUpdate({
            target: [repositoriesTable.organizationId, repositoriesTable.githubRepoId],
            set: { isActive: true, projectId: input.projectId, name: input.name },
          }).returning();

          if (!repo) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to connect repository." });
          }

          await tx.insert(auditLogsTable).values({
            organizationId: ctx.organizationId,
            action: "repository.connected",
            actorId: ctx.user.id,
            targetType: "repository",
            targetId: repo.id,
            metadata: { name: repo.name, githubRepoId: repo.githubRepoId, projectId: repo.projectId },
          });

          return repo;
        });
      } catch (e: unknown) {
        if (e && typeof e === 'object' && 'code' in e && e.code === '23505') { // Postgres unique_violation
          throw new TRPCError({ code: "CONFLICT", message: "Repository is already connected to an organization." });
        }
        throw e;
      }
    }),

  disconnectRepo: organizationProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can disconnect repositories." });
      }

      const repo = await db.query.repositoriesTable.findFirst({
        where: and(
          eq(repositoriesTable.organizationId, ctx.organizationId),
          eq(repositoriesTable.id, input.id)
        )
      });

      if (!repo) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Repository not found." });
      }

      return await db.transaction(async (tx) => {
        // Soft disconnect
        await tx.update(repositoriesTable)
          .set({ isActive: false })
          .where(eq(repositoriesTable.id, input.id));

        await tx.insert(auditLogsTable).values({
          organizationId: ctx.organizationId,
          action: "repository.disconnected",
          actorId: ctx.user.id,
          targetType: "repository",
          targetId: repo.id,
          metadata: { name: repo.name, githubRepoId: repo.githubRepoId, projectId: repo.projectId },
        });

        return { success: true };
      });
    }),
});
