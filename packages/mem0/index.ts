/**
 * ShipFlow AI — Mem0 Context Memory
 *
 * Provides persistent AI context memory using Mem0 Cloud.
 * Memories are scoped by userId + organizationId for multi-tenant isolation.
 *
 * Use cases in ShipFlow:
 * - Clarification Agent remembers user's past feature requests and preferences
 * - PRD Generator recalls organizational coding standards and priorities
 * - Review Agent learns from human feedback on past reviews (precision improvement)
 *
 * The Vercel AI SDK provider (@mem0/vercel-ai-provider) can be used to wrap
 * any model call with automatic memory retrieval/storage.
 */

import { MemoryClient } from "mem0ai";
import { createMem0 } from "@mem0/vercel-ai-provider";

// ─── Mem0 Cloud Client ───────────────────────────────────────

let _client: MemoryClient | null = null;

function getClient(): MemoryClient {
  if (!_client) {
    const apiKey = process.env.MEM0_API_KEY;
    if (!apiKey) {
      throw new Error(
        "MEM0_API_KEY is not set. Get one at https://app.mem0.ai"
      );
    }
    _client = new MemoryClient({ apiKey });
  }
  return _client;
}

// ─── Vercel AI SDK Provider ──────────────────────────────────

let _provider: ReturnType<typeof createMem0> | null = null;

/**
 * Returns a Mem0-wrapped Vercel AI SDK provider.
 * Use this to wrap model calls with automatic memory context.
 *
 * @example
 * ```ts
 * import { getMem0Provider } from "@repo/mem0";
 * const mem0 = getMem0Provider();
 * const model = mem0("gpt-4o-mini", { user_id: "user_123" });
 * ```
 */
export function getMem0Provider() {
  if (!_provider) {
    const apiKey = process.env.MEM0_API_KEY;
    if (!apiKey) {
      throw new Error(
        "MEM0_API_KEY is not set. Get one at https://app.mem0.ai"
      );
    }
    _provider = createMem0({ apiKey });
  }
  return _provider;
}

// ─── Memory Operations ──────────────────────────────────────

interface MemoryScope {
  userId: string;
  organizationId: string;
}

interface AddMemoryOptions extends MemoryScope {
  metadata?: Record<string, string>;
}

/**
 * Store a memory scoped to a user within an organization.
 */
export async function addMemory(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  options: AddMemoryOptions
) {
  const client = getClient();
  return client.add(messages, {
    user_id: options.userId,
    org_id: options.organizationId,
    metadata: options.metadata,
  });
}

/**
 * Search memories relevant to a query, scoped to user + org.
 */
export async function searchMemory(query: string, scope: MemoryScope) {
  const client = getClient();
  return client.search(query, {
    user_id: scope.userId,
    org_id: scope.organizationId,
  });
}

/**
 * Retrieve all memories for a user within an org.
 */
export async function getMemories(scope: MemoryScope) {
  const client = getClient();
  return client.getAll({
    user_id: scope.userId,
    org_id: scope.organizationId,
  });
}

/**
 * Delete a specific memory by ID.
 */
export async function deleteMemory(memoryId: string) {
  const client = getClient();
  return client.delete(memoryId);
}
