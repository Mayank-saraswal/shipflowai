/**
 * ShipFlow AI — Event Contracts
 *
 * Shared event names and payload types used across packages (inngest, ai, github).
 * This package has ZERO runtime dependencies — it's pure TypeScript types.
 * This avoids circular dependencies between packages that both produce and consume events.
 */

// ─── Event Names ─────────────────────────────────────────────
export const EVENTS = {
  // Feature Request lifecycle
  FEATURE_CREATED: "feature.created",
  FEATURE_CLARIFICATION_REQUESTED: "feature.clarification.requested",
  FEATURE_CLARIFYING: "feature.clarifying",
  FEATURE_CONTEXT_READY: "feature.context_ready",
  FEATURE_APPROVED: "feature.approved",
  FEATURE_SHIPPED: "feature.shipped",

  // PRD lifecycle
  PRD_GENERATE: "prd.generate",
  PRD_GENERATED: "prd.generated",
  PRD_APPROVED: "prd.approved",

  // Task lifecycle
  TASKS_GENERATE: "tasks.generate",
  TASKS_GENERATED: "tasks.generated",
  TASKS_APPROVED: "tasks.approved",

  // Pull Request lifecycle
  PR_RECEIVED: "pr.received",
  PR_UPDATED: "pr.updated",

  // AI Review lifecycle
  AI_REVIEW_START: "ai.review.start",
  AI_REVIEW_COMPLETED: "ai.review.completed",

  // Web Research
  WEB_RESEARCH_REQUESTED: "webresearch.requested",
  WEB_RESEARCH_COMPLETED: "webresearch.completed",

  // GitHub Webhooks
  GITHUB_WEBHOOK_RECEIVED: "github.webhook.received",
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

// ─── Event Payloads ──────────────────────────────────────────
export interface FeatureCreatedPayload {
  featureRequestId: string;
  projectId: string;
  organizationId: string;
  title: string;
  description: string;
  createdBy: string;
}

export interface FeatureClarificationRequestedPayload {
  organizationId: string;
  featureRequestId: string;
  sessionId: string;
}

export interface FeatureContextReadyPayload {
  organizationId: string;
  featureRequestId: string;
  sessionId: string;
  summary: string;
}

export interface PRDGeneratePayload {
  featureRequestId: string;
  organizationId: string;
  clarificationTranscript: string;
}

export interface PRDApprovedPayload {
  prdId: string;
  featureRequestId: string;
  organizationId: string;
  approvedBy: string;
}

export interface TasksGeneratePayload {
  prdId: string;
  organizationId: string;
}

export interface PRReceivedPayload {
  pullRequestId: string;
  featureRequestId: string;
  organizationId: string;
  repositoryId: string;
  prNumber: number;
  diff: string;
}

export interface AIReviewStartPayload {
  pullRequestId: string;
  featureRequestId: string;
  prdId: string;
  organizationId: string;
  roundNumber: number;
}

export interface AIReviewCompletedPayload {
  reviewId: string;
  pullRequestId: string;
  organizationId: string;
  hasBlockingIssues: boolean;
}

export interface FeatureApprovedPayload {
  featureRequestId: string;
  organizationId: string;
  approvedBy: string;
}

export interface WebResearchPayload {
  featureRequestId: string;
  organizationId: string;
  query: string;
}

export interface GithubWebhookReceivedPayload {
  event: string;
  action?: string;
  installationId?: number;
  deliveryId: string;
  payload: Record<string, unknown>;
}

// ─── Unified Event Map ───────────────────────────────────────
export interface ShipFlowEventMap extends Record<string, { data: any }> {
  [EVENTS.FEATURE_CREATED]: { data: FeatureCreatedPayload };
  [EVENTS.FEATURE_CLARIFICATION_REQUESTED]: { data: FeatureClarificationRequestedPayload };
  [EVENTS.FEATURE_CONTEXT_READY]: { data: FeatureContextReadyPayload };
  [EVENTS.PRD_GENERATE]: { data: PRDGeneratePayload };
  [EVENTS.PRD_APPROVED]: { data: PRDApprovedPayload };
  [EVENTS.TASKS_GENERATE]: { data: TasksGeneratePayload };
  [EVENTS.PR_RECEIVED]: { data: PRReceivedPayload };
  [EVENTS.AI_REVIEW_START]: { data: AIReviewStartPayload };
  [EVENTS.AI_REVIEW_COMPLETED]: { data: AIReviewCompletedPayload };
  [EVENTS.FEATURE_APPROVED]: { data: FeatureApprovedPayload };
  [EVENTS.WEB_RESEARCH_REQUESTED]: { data: WebResearchPayload };
  [EVENTS.GITHUB_WEBHOOK_RECEIVED]: { data: GithubWebhookReceivedPayload };
}
