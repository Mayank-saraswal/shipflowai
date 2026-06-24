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
    // Step 5: AI clarification loop
    // - Read feature request
    // - Check for duplicate/similar features via embeddings
    // - Start clarification conversation if needed
    return { status: "stub", featureRequestId: event.data.featureRequestId };
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

// ─── All Functions (for serve()) ─────────────────────────────
export const allFunctions = [
  handleFeatureCreated,
  handlePRDGenerate,
  handleTasksGenerate,
  handleAIReviewStart,
  handleWebResearch,
];
