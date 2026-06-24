import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  text,
  integer,
  index,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import {
  featureStatusEnum,
  prdStatusEnum,
  taskStatusEnum,
  clarificationSessionStatusEnum,
  messageRoleEnum,
} from "./enums";
import { usersTable } from "./user";
import { organizationsTable, projectsTable, uuidv7Primary } from "./core";

export const featureRequestsTable = pgTable(
  "feature_requests",
  {
    id: uuidv7Primary("id"),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projectsTable.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    status: featureStatusEnum("status").notNull().default("open"),
    duplicateOfFeatureRequestId: uuid("duplicate_of_feature_request_id"),
    duplicateDecision: varchar("duplicate_decision", { length: 50 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
    createdBy: text("created_by"),
  },
  (table) => ({
    orgCreatedIndex: index("feature_org_created_idx").on(
      table.organizationId,
      table.createdAt
    ),
    projectIndex: index("feature_project_idx").on(
      table.organizationId,
      table.projectId
    ),
  })
);

export const featureClarificationSessionsTable = pgTable(
  "feature_clarification_sessions",
  {
    id: uuidv7Primary("id"),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    featureRequestId: uuid("feature_request_id")
      .notNull()
      .references(() => featureRequestsTable.id, { onDelete: "cascade" }),
    status: clarificationSessionStatusEnum("status").notNull().default("active"),
    roundCount: integer("round_count").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (table) => ({
    orgCreatedIndex: index("clarification_session_org_created_idx").on(
      table.organizationId,
      table.createdAt
    ),
    featureRequestIndex: index("clarification_session_feature_idx").on(
      table.featureRequestId
    ),
  })
);

export const featureClarificationMessagesTable = pgTable(
  "feature_clarification_messages",
  {
    id: uuidv7Primary("id"),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => featureClarificationSessionsTable.id, { onDelete: "cascade" }),
    role: messageRoleEnum("role").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    orgCreatedIndex: index("clarification_message_org_created_idx").on(
      table.organizationId,
      table.createdAt
    ),
    sessionIndex: index("clarification_message_session_idx").on(
      table.sessionId,
      table.createdAt
    ),
  })
);

export const prdsTable = pgTable(
  "prds",
  {
    id: uuidv7Primary("id"),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projectsTable.id, { onDelete: "cascade" }),
    featureRequestId: uuid("feature_request_id").references(
      () => featureRequestsTable.id,
      { onDelete: "set null" }
    ),
    prdId: uuid("prd_id").notNull(), // Grouping ID for all versions of this PRD
    version: integer("version").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    content: text("content").notNull(),
    status: prdStatusEnum("status").notNull().default("draft"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    createdBy: text("created_by"),
    // No updatedAt since PRDs are immutable
  },
  (table) => ({
    orgCreatedIndex: index("prd_org_created_idx").on(
      table.organizationId,
      table.createdAt
    ),
    prdVersionUnique: uniqueIndex("prd_version_unique_idx").on(
      table.prdId,
      table.version
    ),
    versionCheck: check("prd_version_check", sql`${table.version} >= 1`),
  })
);

export const tasksTable = pgTable(
  "tasks",
  {
    id: uuidv7Primary("id"),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projectsTable.id, { onDelete: "cascade" }),
    prdId: uuid("prd_id").references(() => prdsTable.id, {
      onDelete: "set null",
    }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    status: taskStatusEnum("status").notNull().default("todo"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
    createdBy: text("created_by"),
    assignedTo: text("assigned_to"),
  },
  (table) => ({
    orgCreatedIndex: index("task_org_created_idx").on(
      table.organizationId,
      table.createdAt
    ),
    projectIndex: index("task_project_idx").on(
      table.organizationId,
      table.projectId
    ),
  })
);
