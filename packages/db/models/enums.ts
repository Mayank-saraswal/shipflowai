import { pgEnum } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["admin", "member", "viewer"]);
export const featureStatusEnum = pgEnum("feature_status", ["open", "planned", "in_progress", "completed", "closed", "pending_duplicate_check"]);
export const prdStatusEnum = pgEnum("prd_status", ["draft", "approved", "superseded"]);
export const taskStatusEnum = pgEnum("task_status", ["todo", "in_progress", "in_review", "done"]);
export const pullRequestStatusEnum = pgEnum("pr_status", ["open", "merged", "closed", "draft"]);
export const reviewStatusEnum = pgEnum("review_status", ["pending", "approved", "changes_requested", "commented"]);

// Enums for Feature Request Clarification
export const clarificationSessionStatusEnum = pgEnum("clarification_session_status", ["active", "awaiting_ai_response", "context_ready", "manual_review"]);
export const messageRoleEnum = pgEnum("message_role", ["user", "ai"]);
