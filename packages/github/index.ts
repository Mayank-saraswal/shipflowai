/**
 * ShipFlow AI — GitHub Integration
 *
 * Provides:
 * 1. Octokit client factory — creates authenticated clients per-installation
 * 2. Webhook signature verification — validates GitHub webhook payloads
 * 3. PR/diff fetching — retrieves changed files and unified diffs
 *
 * All PR data is live from GitHub — no hardcoded/mocked data.
 * The webhook handler only verifies + dispatches events; real processing
 * happens in Inngest functions (packages/inngest).
 */

import { Octokit } from "octokit";
import { Webhooks } from "@octokit/webhooks";
import crypto from "node:crypto";

// ─── Octokit Client Factory ─────────────────────────────────

interface OctokitConfig {
  token: string;
}

/**
 * Creates an authenticated Octokit client for a specific GitHub installation/token.
 */
export function createOctokitClient(config: OctokitConfig): Octokit {
  return new Octokit({
    auth: config.token,
  });
}

// ─── Webhook Verification ────────────────────────────────────

/**
 * Verifies a GitHub webhook signature.
 * Uses HMAC-SHA256 with the webhook secret.
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const webhooks = new Webhooks({ secret });
  return webhooks.verify(payload, signature);
}

/**
 * Creates a Webhooks instance for handling GitHub webhook events.
 */
export function createWebhookHandler(secret: string): Webhooks {
  return new Webhooks({ secret });
}

// ─── PR Data Types ───────────────────────────────────────────

export interface PullRequestData {
  prNumber: number;
  title: string;
  body: string | null;
  headBranch: string;
  baseBranch: string;
  headSha: string;
  state: "open" | "closed" | "merged";
  htmlUrl: string;
  diff: string;
  changedFiles: ChangedFile[];
}

export interface ChangedFile {
  filename: string;
  status: "added" | "removed" | "modified" | "renamed";
  additions: number;
  deletions: number;
  patch: string | undefined;
}

// ─── PR/Diff Fetching ────────────────────────────────────────

/**
 * Fetches full PR data including diff and changed files.
 */
export async function fetchPullRequestData(
  client: Octokit,
  owner: string,
  repo: string,
  prNumber: number
): Promise<PullRequestData> {
  const [prResponse, filesResponse] = await Promise.all([
    client.rest.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
      mediaType: { format: "diff" },
    }),
    client.rest.pulls.listFiles({
      owner,
      repo,
      pull_number: prNumber,
      per_page: 100,
    }),
  ]);

  const pr = prResponse.data;

  const changedFiles: ChangedFile[] = filesResponse.data.map((file) => ({
    filename: file.filename,
    status: file.status as ChangedFile["status"],
    additions: file.additions,
    deletions: file.deletions,
    patch: file.patch,
  }));

  return {
    prNumber,
    title: typeof pr === "string" ? "" : pr.title,
    body: typeof pr === "string" ? null : pr.body,
    headBranch: typeof pr === "string" ? "" : pr.head.ref,
    baseBranch: typeof pr === "string" ? "" : pr.base.ref,
    headSha: typeof pr === "string" ? "" : pr.head.sha,
    state: typeof pr === "string" ? "open" : (pr.merged ? "merged" : pr.state) as PullRequestData["state"],
    htmlUrl: typeof pr === "string" ? "" : pr.html_url,
    diff: typeof pr === "string" ? pr : "",
    changedFiles,
  };
}

/**
 * Posts a review comment on a PR.
 */
export async function postPRComment(
  client: Octokit,
  owner: string,
  repo: string,
  prNumber: number,
  body: string
): Promise<void> {
  await client.rest.issues.createComment({
    owner,
    repo,
    issue_number: prNumber,
    body,
  });
}
