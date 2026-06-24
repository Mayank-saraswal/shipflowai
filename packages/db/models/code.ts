import {
  pgTable,
  boolean,
  uuid,
  varchar,
  timestamp,
  text,
  index,
  uniqueIndex,
  check,
  
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { pullRequestStatusEnum, reviewStatusEnum } from "./enums";
import { usersTable } from "./user";
import { organizationsTable, uuidv7Primary, projectsTable } from "./core";
import { prdsTable } from "./product";

export const repositoriesTable = pgTable(
  "repositories",
  {
    id: uuidv7Primary("id"),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projectsTable.id, { onDelete: "cascade" }),
    githubRepoId: varchar("github_repo_id", { length: 255 }).notNull(),
    githubInstallationId: varchar("github_installation_id", { length: 255 }),
    name: varchar("name", { length: 255 }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (table) => ({
    orgRepoUnique: uniqueIndex("repo_org_github_unique_idx").on(
      table.organizationId,
      table.githubRepoId
    ),
    orgCreatedIndex: index("repo_org_created_idx").on(
      table.organizationId,
      table.createdAt
    ),
  })
);

export const pullRequestsTable = pgTable(
  "pull_requests",
  {
    id: uuidv7Primary("id"),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    repositoryId: uuid("repository_id")
      .notNull()
      .references(() => repositoriesTable.id, { onDelete: "cascade" }),
    githubPrId: varchar("github_pr_id", { length: 255 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    status: pullRequestStatusEnum("status").notNull().default("open"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
    createdBy: text("created_by"), // Could link to a user mapping
  },
  (table) => ({
    orgCreatedIndex: index("pr_org_created_idx").on(
      table.organizationId,
      table.createdAt
    ),
    repoIndex: index("pr_repo_idx").on(table.organizationId, table.repositoryId),
  })
);

export const reviewsTable = pgTable(
  "reviews",
  {
    id: uuidv7Primary("id"),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    pullRequestId: uuid("pull_request_id")
      .notNull()
      .references(() => pullRequestsTable.id, { onDelete: "cascade" }),
    status: reviewStatusEnum("status").notNull().default("pending"),
    content: text("content"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
    createdBy: text("created_by"),
  },
  (table) => ({
    orgCreatedIndex: index("review_org_created_idx").on(
      table.organizationId,
      table.createdAt
    ),
    prIndex: index("review_pr_idx").on(
      table.organizationId,
      table.pullRequestId
    ),
  })
);

export const reviewIssuesTable = pgTable(
  "review_issues",
  {
    id: uuidv7Primary("id"),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    reviewId: uuid("review_id")
      .notNull()
      .references(() => reviewsTable.id, { onDelete: "cascade" }),
    severity: varchar("severity", { length: 50 }).notNull(),
    explanation: text("explanation").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    createdBy: text("created_by"),
    // No updatedAt because this is an append-only log of the issue creation
  },
  (table) => ({
    orgCreatedIndex: index("review_issue_org_created_idx").on(
      table.organizationId,
      table.createdAt
    ),
  })
);

export const reviewIssueEventsTable = pgTable(
  "review_issue_events",
  {
    id: uuidv7Primary("id"),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    reviewIssueId: uuid("review_issue_id")
      .notNull()
      .references(() => reviewIssuesTable.id, { onDelete: "cascade" }),
    eventType: varchar("event_type", { length: 50 }).notNull(), // e.g., 'resolved', 'not_an_issue', 'reopened'
    comment: text("comment"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    createdBy: text("created_by"),
    // Append-only
  },
  (table) => ({
    orgCreatedIndex: index("review_issue_events_org_created_idx").on(
      table.organizationId,
      table.createdAt
    ),
  })
);

export const approvalsTable = pgTable(
  "approvals",
  {
    id: uuidv7Primary("id"),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    prdId: uuid("prd_id").references(() => prdsTable.id, {
      onDelete: "cascade",
    }),
    pullRequestId: uuid("pull_request_id").references(
      () => pullRequestsTable.id,
      { onDelete: "cascade" }
    ),
    comment: text("comment"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    createdBy: text("created_by"),
  },
  (table) => ({
    orgCreatedIndex: index("approval_org_created_idx").on(
      table.organizationId,
      table.createdAt
    ),
    exactlyOneTarget: check(
      "approval_exactly_one_target_check",
      sql`((${table.prdId} IS NOT NULL AND ${table.pullRequestId} IS NULL) OR (${table.prdId} IS NULL AND ${table.pullRequestId} IS NOT NULL))`
    ),
  })
);
