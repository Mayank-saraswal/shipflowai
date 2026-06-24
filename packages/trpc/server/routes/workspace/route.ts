import { z } from "zod";
import { organizationProcedure, router } from "../../trpc";
import { db } from "@repo/db";
import { workspacesTable, auditLogsTable } from "@repo/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const workspaceRouter = router({
  list: organizationProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(), // createdAt cursor
      })
    )
    .query(async ({ ctx, input }) => {
      const items = await db.query.workspacesTable.findMany({
        where: and(
          eq(workspacesTable.organizationId, ctx.organizationId),
          input.cursor ? undefined : undefined // Proper cursor logic can be added later
        ),
        limit: input.limit + 1,
        orderBy: [desc(workspacesTable.createdAt)],
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

  create: organizationProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can create workspaces." });
      }

      const existing = await db.query.workspacesTable.findFirst({
        where: and(
          eq(workspacesTable.organizationId, ctx.organizationId),
          eq(workspacesTable.slug, input.slug)
        )
      });
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Workspace slug already exists." });
      }

      return await db.transaction(async (tx) => {
        const [workspace] = await tx.insert(workspacesTable).values({
          organizationId: ctx.organizationId,
          name: input.name,
          slug: input.slug,
          description: input.description,
        }).returning();

        if (!workspace) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create workspace." });

        await tx.insert(auditLogsTable).values({
          organizationId: ctx.organizationId,
          action: "workspace.created",
          actorId: ctx.user.id,
          targetType: "workspace",
          targetId: workspace.id,
          metadata: { name: workspace.name, slug: workspace.slug },
        });

        return workspace;
      });
    }),

  update: organizationProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(255).optional(),
        slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/).optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can update workspaces." });
      }

      const workspace = await db.query.workspacesTable.findFirst({
        where: and(
          eq(workspacesTable.organizationId, ctx.organizationId),
          eq(workspacesTable.id, input.id)
        )
      });

      if (!workspace) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Workspace not found." });
      }

      return await db.transaction(async (tx) => {
        const [updated] = await tx.update(workspacesTable)
          .set({
            name: input.name,
            slug: input.slug,
            description: input.description,
          })
          .where(eq(workspacesTable.id, input.id))
          .returning();

        if (!updated) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update workspace." });
        }

        await tx.insert(auditLogsTable).values({
          organizationId: ctx.organizationId,
          action: "workspace.updated",
          actorId: ctx.user.id,
          targetType: "workspace",
          targetId: updated.id,
          metadata: { name: updated.name, slug: updated.slug },
        });

        return updated;
      });
    }),

  delete: organizationProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can delete workspaces." });
      }

      const workspace = await db.query.workspacesTable.findFirst({
        where: and(
          eq(workspacesTable.organizationId, ctx.organizationId),
          eq(workspacesTable.id, input.id)
        )
      });

      if (!workspace) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Workspace not found." });
      }

      return await db.transaction(async (tx) => {
        await tx.delete(workspacesTable).where(eq(workspacesTable.id, input.id));

        await tx.insert(auditLogsTable).values({
          organizationId: ctx.organizationId,
          action: "workspace.deleted",
          actorId: ctx.user.id,
          targetType: "workspace",
          targetId: workspace.id,
          metadata: { name: workspace.name, slug: workspace.slug },
        });

        return { success: true };
      });
    }),
});
