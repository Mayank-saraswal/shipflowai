import { z } from "zod";
import { organizationProcedure, router } from "../../trpc";
import { db } from "@repo/db";
import { projectsTable, auditLogsTable, workspacesTable } from "@repo/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const projectRouter = router({
  list: organizationProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(), // createdAt cursor
      })
    )
    .query(async ({ ctx, input }) => {
      const items = await db.query.projectsTable.findMany({
        where: and(
          eq(projectsTable.organizationId, ctx.organizationId),
          eq(projectsTable.workspaceId, input.workspaceId),
          input.cursor ? undefined : undefined // Proper cursor logic can be added later
        ),
        limit: input.limit + 1,
        orderBy: [desc(projectsTable.createdAt)],
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
        workspaceId: z.string(),
        name: z.string().min(1).max(255),
        slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can create projects." });
      }

      // Verify workspace belongs to organization
      const workspace = await db.query.workspacesTable.findFirst({
        where: and(
          eq(workspacesTable.id, input.workspaceId),
          eq(workspacesTable.organizationId, ctx.organizationId)
        )
      });

      if (!workspace) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Workspace not found." });
      }

      const existing = await db.query.projectsTable.findFirst({
        where: and(
          eq(projectsTable.workspaceId, input.workspaceId),
          eq(projectsTable.slug, input.slug)
        )
      });
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Project slug already exists in this workspace." });
      }

      return await db.transaction(async (tx) => {
        const [project] = await tx.insert(projectsTable).values({
          organizationId: ctx.organizationId,
          workspaceId: input.workspaceId,
          name: input.name,
          slug: input.slug,
          description: input.description,
        }).returning();

        if (!project) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create project." });

        await tx.insert(auditLogsTable).values({
          organizationId: ctx.organizationId,
          action: "project.created",
          actorId: ctx.user.id,
          targetType: "project",
          targetId: project.id,
          metadata: { name: project.name, slug: project.slug, workspaceId: project.workspaceId },
        });

        return project;
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
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can update projects." });
      }

      const project = await db.query.projectsTable.findFirst({
        where: and(
          eq(projectsTable.organizationId, ctx.organizationId),
          eq(projectsTable.id, input.id)
        )
      });

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found." });
      }

      return await db.transaction(async (tx) => {
        const [updated] = await tx.update(projectsTable)
          .set({
            name: input.name,
            slug: input.slug,
            description: input.description,
          })
          .where(eq(projectsTable.id, input.id))
          .returning();

        if (!updated) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update project." });
        }

        await tx.insert(auditLogsTable).values({
          organizationId: ctx.organizationId,
          action: "project.updated",
          actorId: ctx.user.id,
          targetType: "project",
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
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can delete projects." });
      }

      const project = await db.query.projectsTable.findFirst({
        where: and(
          eq(projectsTable.organizationId, ctx.organizationId),
          eq(projectsTable.id, input.id)
        )
      });

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found." });
      }

      return await db.transaction(async (tx) => {
        await tx.delete(projectsTable).where(eq(projectsTable.id, input.id));

        await tx.insert(auditLogsTable).values({
          organizationId: ctx.organizationId,
          action: "project.deleted",
          actorId: ctx.user.id,
          targetType: "project",
          targetId: project.id,
          metadata: { name: project.name, slug: project.slug },
        });

        return { success: true };
      });
    }),
});
