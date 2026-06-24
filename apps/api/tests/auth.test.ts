import test from "node:test";
import assert from "node:assert";
import { db } from "@repo/db";
import { usersTable, organizationsTable, sessionsTable, membershipsTable, invitesTable } from "@repo/db/schema";
import { eq } from "drizzle-orm";
import { organizationRouter } from "@repo/trpc/server/routes/organization/route";

test("Multi-Tenant Auth & Isolation Tests", async (t) => {
  // Test setup
  const user1 = await db.insert(usersTable).values({
    id: "user_test_1",
    name: "Test User 1",
    email: "test1@example.com",
    emailVerified: true,
  }).returning().then(r => r[0]);

  const session1 = await db.insert(sessionsTable).values({
    id: "session_test_1",
    userId: user1.id,
    token: "token_1",
    expiresAt: new Date(Date.now() + 1000000),
  }).returning().then(r => r[0]);

  await t.test("create organization atomically sets membership and session active org", async () => {
    const caller = organizationRouter.createCaller({
      req: {} as unknown as Request,
      res: {} as unknown as Response,
      user: user1,
      session: session1,
      organizationId: null, // Initial state, no active org
    });

    const org = await caller.create({ name: "Acme Corp", slug: "acme-test" });
    assert.strictEqual(org.slug, "acme-test");

    // Verify membership was created
    const membership = await db.query.membershipsTable.findFirst({
      where: eq(membershipsTable.organizationId, org.id)
    });
    assert.strictEqual(membership?.userId, user1.id);
    assert.strictEqual(membership?.role, "admin");

    // Verify active organization is set in session
    const updatedSession = await db.query.sessionsTable.findFirst({
      where: eq(sessionsTable.id, session1.id)
    });
    assert.strictEqual(updatedSession?.activeOrganizationId, org.id);
  });

  await t.test("invite system prevents reusing consumed invites", async () => {
    // Re-fetch the created org
    const updatedSession = await db.query.sessionsTable.findFirst({
      where: eq(sessionsTable.id, session1.id)
    });
    
    // Create caller as the owner
    const ownerCaller = organizationRouter.createCaller({
      req: {} as unknown as Request,
      res: {} as unknown as Response,
      user: user1,
      session: updatedSession!,
      organizationId: updatedSession!.activeOrganizationId!,
      role: "admin"
    });

    const invite = await ownerCaller.inviteUser({ email: "test2@example.com", role: "member" });
    assert.strictEqual(invite.status, "pending");

    // Create user 2
    const user2 = await db.insert(usersTable).values({
      id: "user_test_2",
      name: "Test User 2",
      email: "test2@example.com",
      emailVerified: true,
    }).returning().then(r => r[0]);
    const session2 = await db.insert(sessionsTable).values({
      id: "session_test_2",
      userId: user2.id,
      token: "token_2",
      expiresAt: new Date(Date.now() + 1000000),
    }).returning().then(r => r[0]);

    const inviteeCaller = organizationRouter.createCaller({
      req: {} as unknown as Request,
      res: {} as unknown as Response,
      user: user2,
      session: session2,
      organizationId: null,
    });

    // Accept invite
    const res = await inviteeCaller.acceptInvite({ token: invite.token });
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.organizationId, invite.organizationId);

    // Try to accept again -> should fail
    try {
      await inviteeCaller.acceptInvite({ token: invite.token });
      assert.fail("Should have thrown error");
    } catch (err: unknown) {
      if (err instanceof Error) {
        assert.strictEqual(err.message, "Invite already consumed or revoked");
      } else {
        assert.fail("Expected Error object");
      }
    }
  });

  // Cleanup
  await db.delete(usersTable).where(eq(usersTable.id, "user_test_1"));
  await db.delete(usersTable).where(eq(usersTable.id, "user_test_2"));
  // Cascading deletes will remove the organizations, memberships, sessions, and invites
});
