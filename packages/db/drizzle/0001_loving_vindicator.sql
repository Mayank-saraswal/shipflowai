CREATE TABLE "github_installations" (
	"installation_id" varchar(255) PRIMARY KEY NOT NULL,
	"github_account_login" varchar(255) NOT NULL,
	"organization_id" uuid NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"connected_by_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "slug" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "slug" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "project_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "github_installations" ADD CONSTRAINT "github_installations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "github_installation_org_idx" ON "github_installations" USING btree ("organization_id");--> statement-breakpoint
ALTER TABLE "repositories" ADD CONSTRAINT "repositories_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "project_workspace_name_unique_idx" ON "projects" USING btree ("workspace_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "project_workspace_slug_unique_idx" ON "projects" USING btree ("workspace_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_org_name_unique_idx" ON "workspaces" USING btree ("organization_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_org_slug_unique_idx" ON "workspaces" USING btree ("organization_id","slug");