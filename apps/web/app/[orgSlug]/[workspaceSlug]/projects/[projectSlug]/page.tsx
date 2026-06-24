"use client";

import { api } from "~/trpc/react";
import { useParams } from "next/navigation";
import { Button } from "~/components/ui/button";

export default function ProjectPage() {
  const { orgSlug, workspaceSlug, projectSlug } = useParams();

  // In a real implementation, we would fetch the project details using the slug,
  // but for now, we'll assume we have a project context or query
  
  // const { data: project } = api.project.getBySlug.useQuery({ slug: projectSlug });
  // const { data: repos } = api.repository.list.useQuery({ projectId: project?.id });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-[-0.024em]">Project: {projectSlug}</h1>
        <p className="text-sm text-muted-foreground">Manage your connected repositories and project settings.</p>
      </div>

      <div className="rounded-lg border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
          <div>
            <h2 className="text-lg font-medium text-card-foreground">Connected Repositories</h2>
            <p className="text-sm text-muted-foreground mt-1">Repositories linked to this project for analysis and tracking.</p>
          </div>
          <Button size="sm" className="shadow-sm">Connect Repository</Button>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
               <svg width="24" height="24" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
                  <path fill="currentColor" d="M208,40H48A16,16,0,0,0,32,56V200a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V56A16,16,0,0,0,208,40ZM208,56V88H152V56ZM136,56V88H48V56ZM48,104H136v96H48Zm104,96V104h56v96Z"/>
                </svg>
            </div>
            <h3 className="text-lg font-medium">No repositories connected</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm">
              Connect a GitHub repository to start syncing issues and pull requests.
            </p>
            <Button variant="secondary" className="shadow-sm">Connect Repository</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
