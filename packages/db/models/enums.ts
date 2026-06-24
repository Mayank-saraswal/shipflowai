import { pgEnum } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["admin", "member", "viewer"]);
export const featureStatusEnum = pgEnum("feature_status", ["open", "planned", "in_progress", "completed", "closed"]);
export const prdStatusEnum = pgEnum("prd_status", ["draft", "approved", "superseded"]);
export const taskStatusEnum = pgEnum("task_status", ["todo", "in_progress", "in_review", "done"]);
export const pullRequestStatusEnum = pgEnum("pr_status", ["open", "merged", "closed", "draft"]);
export const reviewStatusEnum = pgEnum("review_status", ["pending", "approved", "changes_requested", "commented"]);
