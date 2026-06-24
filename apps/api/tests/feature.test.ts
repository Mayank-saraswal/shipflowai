import { expect, test, describe, beforeAll, afterAll } from "vitest";
import { app } from "../src/server";
import { db } from "@repo/db";
import {
  organizationsTable,
  usersTable,
  featureRequestsTable,
  featureClarificationSessionsTable,
  featureClarificationMessagesTable,
  membershipsTable
} from "@repo/db/schema";
import { eq } from "drizzle-orm";
import { featureRouter } from "@repo/trpc/server/routes/feature/route";
import type { Context } from "@repo/trpc/server/context";

describe("Feature Routes", () => {
  let orgId1: string;
  let orgId2: string;
  let userId1: string;
  let userId2: string;
  let sessionId1: string;

  beforeAll(async () => {
    // Setup users
    const [u1] = await db.insert(usersTable).values({
      email: "test1@example.com",
      name: "Test User 1",
    }).returning();
    userId1 = u1.id;

    const [u2] = await db.insert(usersTable).values({
      email: "test2@example.com",
      name: "Test User 2",
    }).returning();
    userId2 = u2.id;

    // Setup orgs
    const [org1] = await db.insert(organizationsTable).values({
      name: "Org 1",
      slug: "org-1",
    }).returning();
    orgId1 = org1.id;

    const [org2] = await db.insert(organizationsTable).values({
      name: "Org 2",
      slug: "org-2",
    }).returning();
    orgId2 = org2.id;

    // Memberships
    await db.insert(membershipsTable).values({
      organizationId: orgId1,
      userId: userId1,
      role: "admin",
      scopeId: orgId1,
      scopeType: "organization"
    });

    await db.insert(membershipsTable).values({
      organizationId: orgId2,
      userId: userId2,
      role: "admin",
      scopeId: orgId2,
      scopeType: "organization"
    });

    // Create session for org 1
    const [feature] = await db.insert(featureRequestsTable).values({
      organizationId: orgId1,
      projectId: "dummy",
      title: "Test Feature",
    }).returning();

    const [session] = await db.insert(featureClarificationSessionsTable).values({
      organizationId: orgId1,
      featureRequestId: feature.id,
      status: "active",
    }).returning();
    sessionId1 = session.id;
  });

  afterAll(async () => {
    await db.delete(organizationsTable).where(eq(organizationsTable.id, orgId1));
    await db.delete(organizationsTable).where(eq(organizationsTable.id, orgId2));
    await db.delete(usersTable).where(eq(usersTable.id, userId1));
    await db.delete(usersTable).where(eq(usersTable.id, userId2));
  });

  test("Tenant isolation: User 2 (Org 2) cannot access Session 1 (Org 1)", async () => {
    const caller = featureRouter.createCaller({
      user: { id: userId2 } as unknown as Context["user"],
      organizationId: orgId2,
      role: "admin",
      req: {} as unknown as Context["req"],
      res: {} as unknown as Context["res"],
      session: {} as unknown as Context["session"],
    });

    await expect(caller.getSession({ sessionId: sessionId1 })).rejects.toThrowError("NOT_FOUND");
    await expect(caller.submitMessage({ sessionId: sessionId1, content: "test" })).rejects.toThrowError("NOT_FOUND");
  });

  test("Concurrent submit guard: Blocks submit if session is awaiting_ai_response", async () => {
    const caller = featureRouter.createCaller({
      user: { id: userId1 } as unknown as Context["user"],
      organizationId: orgId1,
      role: "admin",
      req: {} as unknown as Context["req"],
      res: {} as unknown as Context["res"],
      session: {} as unknown as Context["session"],
    });

    // Update status to awaiting
    await db.update(featureClarificationSessionsTable)
      .set({ status: "awaiting_ai_response" })
      .where(eq(featureClarificationSessionsTable.id, sessionId1));

    await expect(caller.submitMessage({ sessionId: sessionId1, content: "test" })).rejects.toThrowError("CONFLICT");

    // Reset status
    await db.update(featureClarificationSessionsTable)
      .set({ status: "active" })
      .where(eq(featureClarificationSessionsTable.id, sessionId1));
  });
});
