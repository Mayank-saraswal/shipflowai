import { z } from "zod";
import { protectedProcedure, organizationProcedure, router } from "../../trpc";
import { db } from "@repo/db";
import { organizationsTable, membershipsTable, invitesTable, sessionsTable } from "@repo/db/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import crypto from "crypto";

const RESERVED_SLUGS = ["api", "trpc", "auth", "admin", "dashboard", "settings", "create-organization"];

export const organizationRouter = router({
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(2).max(50),
      slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
    }))
    .mutation(async ({ ctx, input }) => {
      if (RESERVED_SLUGS.includes(input.slug)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Reserved slug" });
      }

      // Check if slug exists
      const existing = await db.query.organizationsTable.findFirst({
        where: eq(organizationsTable.slug, input.slug)
      });
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Slug already taken" });
      }

      // Atomic creation of Org + Membership + Active Session update
      const org = await db.transaction(async (tx) => {
        const [newOrg] = await tx.insert(organizationsTable).values({
          name: input.name,
          slug: input.slug,
        }).returning();

        await tx.insert(membershipsTable).values({
          organizationId: newOrg.id,
          userId: ctx.user.id,
          role: "owner",
          scopeType: "organization",
          scopeId: newOrg.id,
        });

        // Set this as the active organization in BetterAuth's session
        await tx.update(sessionsTable)
          .set({ activeOrganizationId: newOrg.id })
          .where(eq(sessionsTable.id, ctx.session.id));

        return newOrg;
      });

      return org;
    }),

  inviteUser: organizationProcedure
    .input(z.object({
      email: z.string().email(),
      role: z.enum(["owner", "admin", "member"]),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.role !== "owner" && ctx.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not allowed to invite" });
      }

      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      const [invite] = await db.insert(invitesTable).values({
        organizationId: ctx.organizationId,
        inviterId: ctx.user.id,
        email: input.email,
        role: input.role,
        token,
        expiresAt,
        status: "pending"
      }).returning();

      return invite;
    }),

  acceptInvite: protectedProcedure
    .input(z.object({
      token: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await db.transaction(async (tx) => {
        const invite = await tx.query.invitesTable.findFirst({
          where: eq(invitesTable.token, input.token)
        });

        if (!invite) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Invalid invite" });
        }
        if (invite.status !== "pending" || invite.consumedAt) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invite already consumed or revoked" });
        }
        if (invite.expiresAt < new Date()) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invite expired" });
        }
        if (invite.email !== ctx.user.email) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Email mismatch" });
        }

        // Mark consumed and create membership atomically
        await tx.update(invitesTable)
          .set({ status: "accepted", consumedAt: new Date() })
          .where(eq(invitesTable.id, invite.id));

        await tx.insert(membershipsTable).values({
          organizationId: invite.organizationId,
          userId: ctx.user.id,
          role: invite.role,
          scopeType: "organization",
          scopeId: invite.organizationId,
        });

        // Auto-switch to this org
        await tx.update(sessionsTable)
          .set({ activeOrganizationId: invite.organizationId })
          .where(eq(sessionsTable.id, ctx.session.id));

        return { success: true, organizationId: invite.organizationId };
      });

      return result;
    }),

  revokeInvite: organizationProcedure
    .input(z.object({
      inviteId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.role !== "owner" && ctx.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not allowed to revoke" });
      }

      await db.update(invitesTable)
        .set({ status: "revoked" })
        .where(
          and(
            eq(invitesTable.id, input.inviteId),
            eq(invitesTable.organizationId, ctx.organizationId),
            eq(invitesTable.status, "pending")
          )
        );

      return { success: true };
    })
});
