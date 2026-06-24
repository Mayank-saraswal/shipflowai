/**
 * ShipFlow AI — Feature Request Status Machine
 *
 * Defines every status a feature request can be in, and which transitions are valid.
 * Used by both frontend (UI state display) and backend (guard clauses on mutations).
 */

export const FeatureRequestStatus = {
  SUBMITTED: "submitted",
  CLARIFYING: "clarifying",
  CONTEXT_READY: "context_ready",
  PRD_DRAFT: "prd_draft",
  PRD_APPROVED: "prd_approved",
  TASKS_GENERATED: "tasks_generated",
  TASKS_APPROVED: "tasks_approved",
  DEV_READY: "dev_ready",
  PR_OPEN: "pr_open",
  AI_REVIEWING: "ai_reviewing",
  FIX_NEEDED: "fix_needed",
  REVIEW_PASSED: "review_passed",
  SHIPPED: "shipped",
  BLOCKED: "blocked",
} as const;

export type FeatureRequestStatusType =
  (typeof FeatureRequestStatus)[keyof typeof FeatureRequestStatus];

/** Valid transitions — used as a guard in status mutation logic */
export const VALID_TRANSITIONS: Record<FeatureRequestStatusType, readonly FeatureRequestStatusType[]> = {
  [FeatureRequestStatus.SUBMITTED]: [FeatureRequestStatus.CLARIFYING],
  [FeatureRequestStatus.CLARIFYING]: [FeatureRequestStatus.CONTEXT_READY, FeatureRequestStatus.BLOCKED],
  [FeatureRequestStatus.CONTEXT_READY]: [FeatureRequestStatus.PRD_DRAFT],
  [FeatureRequestStatus.PRD_DRAFT]: [FeatureRequestStatus.PRD_APPROVED, FeatureRequestStatus.CLARIFYING],
  [FeatureRequestStatus.PRD_APPROVED]: [FeatureRequestStatus.TASKS_GENERATED],
  [FeatureRequestStatus.TASKS_GENERATED]: [FeatureRequestStatus.TASKS_APPROVED],
  [FeatureRequestStatus.TASKS_APPROVED]: [FeatureRequestStatus.DEV_READY],
  [FeatureRequestStatus.DEV_READY]: [FeatureRequestStatus.PR_OPEN],
  [FeatureRequestStatus.PR_OPEN]: [FeatureRequestStatus.AI_REVIEWING],
  [FeatureRequestStatus.AI_REVIEWING]: [FeatureRequestStatus.FIX_NEEDED, FeatureRequestStatus.REVIEW_PASSED],
  [FeatureRequestStatus.FIX_NEEDED]: [FeatureRequestStatus.PR_OPEN, FeatureRequestStatus.DEV_READY],
  [FeatureRequestStatus.REVIEW_PASSED]: [FeatureRequestStatus.SHIPPED, FeatureRequestStatus.FIX_NEEDED],
  [FeatureRequestStatus.SHIPPED]: [],
  [FeatureRequestStatus.BLOCKED]: [FeatureRequestStatus.CLARIFYING, FeatureRequestStatus.SUBMITTED],
} as const;

export const ReviewIssueSeverity = {
  BLOCKING: "blocking",
  NON_BLOCKING: "non_blocking",
} as const;

export type ReviewIssueSeverityType =
  (typeof ReviewIssueSeverity)[keyof typeof ReviewIssueSeverity];

export const ReviewIssueStatus = {
  OPEN: "open",
  RESOLVED: "resolved",
  DISMISSED: "dismissed",
} as const;

export type ReviewIssueStatusType =
  (typeof ReviewIssueStatus)[keyof typeof ReviewIssueStatus];

export const ReviewIssueCategory = {
  REQUIREMENTS_MISMATCH: "requirements_mismatch",
  SECURITY: "security",
  PERFORMANCE: "performance",
  EDGE_CASE: "edge_case",
  CODE_QUALITY: "code_quality",
  ACCEPTANCE_CRITERIA: "acceptance_criteria",
} as const;

export type ReviewIssueCategoryType =
  (typeof ReviewIssueCategory)[keyof typeof ReviewIssueCategory];

export const TaskStatus = {
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  IN_REVIEW: "in_review",
  DONE: "done",
} as const;

export type TaskStatusType = (typeof TaskStatus)[keyof typeof TaskStatus];

export const PRDStatus = {
  DRAFT: "draft",
  IN_REVIEW: "in_review",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

export type PRDStatusType = (typeof PRDStatus)[keyof typeof PRDStatus];

export const MemberRole = {
  OWNER: "owner",
  ADMIN: "admin",
  MANAGER: "manager",
  DEVELOPER: "developer",
  REVIEWER: "reviewer",
} as const;

export type MemberRoleType = (typeof MemberRole)[keyof typeof MemberRole];
