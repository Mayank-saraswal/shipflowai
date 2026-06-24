import React from "react";
import { IntakeFlow } from "~/components/feature/IntakeFlow";
import { db } from "@repo/db";
import { projectsTable } from "@repo/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";

interface RequestPageProps {
  params: Promise<{
    orgSlug: string;
    workspaceSlug: string;
    projectSlug: string;
  }>;
}

export default async function RequestPage({ params }: RequestPageProps) {
  const p = await params;
  
  const project = await db.query.projectsTable.findFirst({
    where: eq(projectsTable.slug, p.projectSlug), // Assuming slugs are unique within workspace/org, but we'll just query by slug for simplicity
  });

  if (!project) {
    return notFound();
  }

  return (
    <main className="container max-w-4xl py-10 mx-auto">
      <IntakeFlow projectId={project.id} />
    </main>
  );
}
