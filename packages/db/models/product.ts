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
} from "./enums";
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
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
    createdBy: uuid("created_by"),
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
    createdBy: uuid("created_by"),
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
    createdBy: uuid("created_by"),
    assignedTo: uuid("assigned_to"),
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
