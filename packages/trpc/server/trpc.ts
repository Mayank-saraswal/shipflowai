import { initTRPC, TRPCError } from "@trpc/server";
import { OpenApiMeta } from "trpc-to-openapi";
import { eq, and } from "drizzle-orm";
import { db } from "@repo/db";
import { membershipsTable } from "@repo/db/schema";

import { createContext } from "./context";

export const tRPCContext = initTRPC
  .meta<OpenApiMeta>()
  .context<typeof createContext>()
  .create({});

export const router = tRPCContext.router;
export const publicProcedure = tRPCContext.procedure;

const enforceUserIsAuthed = tRPCContext.middleware(({ ctx, next }) => {
  if (!ctx.user || !ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
  }
  return next({
    ctx: {
      user: ctx.user,
      session: ctx.session,
    },
  });
});

export const protectedProcedure = tRPCContext.procedure.use(enforceUserIsAuthed);

const enforceUserInActiveOrganization = tRPCContext.middleware(async ({ ctx, next }) => {
  if (!ctx.user || !ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
  }
  if (!ctx.organizationId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "No active organization in session. You must be in an organization." });
  }

  // Strictly verify the membership in the DB to ensure role and isolation
  const membership = await db.query.membershipsTable.findFirst({
    where: and(
      eq(membershipsTable.userId, ctx.user.id),
      eq(membershipsTable.organizationId, ctx.organizationId)
    )
  });

  if (!membership) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You are not a member of the active organization." });
  }

  return next({
    ctx: {
      user: ctx.user,
      session: ctx.session,
      organizationId: ctx.organizationId,
      role: membership.role,
    },
  });
});

export const organizationProcedure = tRPCContext.procedure.use(enforceUserInActiveOrganization);
