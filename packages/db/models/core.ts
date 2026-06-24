import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  text,
  integer,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { roleEnum } from "./enums";
import { usersTable } from "./user";

// Helper for native PG18 UUIDv7
export const uuidv7Primary = (name: string) =>
  uuid(name)
    .default(sql`uuidv7()`)
    .primaryKey();

export const organizationsTable = pgTable("organizations", {
  id: uuidv7Primary("id"),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  deactivatedAt: timestamp("deactivated_at"), // soft delete
});

export const workspacesTable = pgTable(
  "workspaces",
  {
    id: uuidv7Primary("id"),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
    deactivatedAt: timestamp("deactivated_at"), // soft delete
  },
  (table) => ({
    orgCreatedIndex: index("workspace_org_created_idx").on(
      table.organizationId,
      table.createdAt
    ),
  })
);

export const projectsTable = pgTable(
  "projects",
  {
    id: uuidv7Primary("id"),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspacesTable.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
    deactivatedAt: timestamp("deactivated_at"), // soft delete
  },
  (table) => ({
    orgCreatedIndex: index("project_org_created_idx").on(
      table.organizationId,
      table.createdAt
    ),
    workspaceIndex: index("project_workspace_idx").on(
      table.organizationId,
      table.workspaceId
    ),
  })
);

export const membershipsTable = pgTable(
  "memberships",
  {
    id: uuidv7Primary("id"),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    role: roleEnum("role").notNull().default("member"),
    scopeType: varchar("scope_type", { length: 50 }).notNull(), // 'organization' or 'project'
    scopeId: uuid("scope_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (table) => ({
    orgCreatedIndex: index("membership_org_created_idx").on(
      table.organizationId,
      table.createdAt
    ),
    userOrgIndex: index("membership_user_org_idx").on(
      table.userId,
      table.organizationId
    ),
  })
);

export const invitesTable = pgTable(
  "invites",
  {
    id: uuidv7Primary("id"),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    role: roleEnum("role").notNull().default("member"),
    status: varchar("status", { length: 50 }).notNull().default("pending"),
    inviterId: text("inviter_id").references(() => usersTable.id, { onDelete: "cascade" }),
    token: varchar("token", { length: 255 }).notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    consumedAt: timestamp("consumed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (table) => ({
    orgCreatedIndex: index("invite_org_created_idx").on(
      table.organizationId,
      table.createdAt
    ),
  })
);

export const subscriptionsTable = pgTable(
  "subscriptions",
  {
    id: uuidv7Primary("id"),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
    stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
    plan: varchar("plan", { length: 100 }).notNull(),
    status: varchar("status", { length: 50 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (table) => ({
    orgUniqueIndex: uniqueIndex("subscription_org_unique_idx").on(
      table.organizationId
    ),
  })
);

export const aiCreditLedgerTable = pgTable(
  "ai_credit_ledger",
  {
    id: uuidv7Primary("id"),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(), // Smallest unit, no floats
    transactionType: varchar("transaction_type", { length: 50 }).notNull(), // 'credit', 'debit'
    referenceType: varchar("reference_type", { length: 100 }), // e.g., 'PRD_GENERATION'
    referenceId: uuid("reference_id"),
    description: varchar("description", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    createdBy: text("created_by")
      .references(() => usersTable.id, { onDelete: "set null" }),
  },
  (table) => ({
    orgCreatedIndex: index("ledger_org_created_idx").on(
      table.organizationId,
      table.createdAt
    ),
  })
);
