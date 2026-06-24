import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  text,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import { usersTable } from "./user";
import { organizationsTable, uuidv7Primary } from "./core";
import { sql } from "drizzle-orm";

// Vector type for pgvector
import { customType } from "drizzle-orm/pg-core";
const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return "vector(1536)";
  },
  toDriver(value: number[]): string {
    return JSON.stringify(value);
  },
  fromDriver(value: string | number[]): number[] {
    if (typeof value === "string") {
      return JSON.parse(value);
    }
    return value;
  },
});

export const auditLogsTable = pgTable(
  "audit_logs",
  {
    id: uuidv7Primary("id"),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    action: varchar("action", { length: 255 }).notNull(), // e.g., 'user.invited', 'prd.approved'
    actorId: text("actor_id"), // User who performed the action
    targetType: varchar("target_type", { length: 100 }), // e.g., 'invite', 'prd'
    targetId: uuid("target_id"),
    metadata: jsonb("metadata"), // Additional context
    createdAt: timestamp("created_at").defaultNow().notNull(),
    // Append-only, no updatedAt
  },
  (table) => ({
    orgCreatedIndex: index("audit_org_created_idx").on(
      table.organizationId,
      table.createdAt
    ),
  })
);

export const embeddingsTable = pgTable(
  "embeddings",
  {
    id: uuidv7Primary("id"),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    sourceType: varchar("source_type", { length: 100 }).notNull(), // e.g., 'PRD', 'ReviewIssue'
    sourceId: uuid("source_id").notNull(),
    contentChunk: text("content_chunk").notNull(),
    embedding: vector("embedding"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    orgCreatedIndex: index("embeddings_org_created_idx").on(
      table.organizationId,
      table.createdAt
    ),
    // HNSW index created manually in migration or via drizzle if supported, but here is standard B-tree for scoping
    sourceIndex: index("embeddings_source_idx").on(
      table.organizationId,
      table.sourceType,
      table.sourceId
    ),
  })
);
