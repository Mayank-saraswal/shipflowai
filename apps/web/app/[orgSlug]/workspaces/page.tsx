"use client";

import { api } from "~/trpc/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "~/components/ui/button";

export default function WorkspacesPage() {
  const { orgSlug } = useParams();
  const { data: workspaces, isLoading } = api.workspace.list.useQuery({ limit: 50 });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-[-0.024em]">Workspaces</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-lg border border-border bg-muted/50 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  const items = workspaces?.items || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.024em]">Workspaces</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your workspaces and their projects.</p>
        </div>
        <Link href={`/${orgSlug}/workspaces/new`}>
          <Button className="h-9 px-4 shadow-sm">Create Workspace</Button>
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-12 text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <svg width="24" height="24" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
              <path fill="currentColor" d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM216,56V88H144V56ZM128,56V88H40V56ZM40,104H128v96H40Zm104,96V104h72v96Z"/>
            </svg>
          </div>
          <h3 className="text-lg font-medium">No workspaces found</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm">
            Workspaces help you organize projects. Create your first workspace to get started.
          </p>
          <Link href={`/${orgSlug}/workspaces/new`}>
            <Button variant="secondary" className="shadow-sm">Create Workspace</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((ws) => (
            <Link key={ws.id} href={`/${orgSlug}/${ws.slug}/projects`} className="group block">
              <div className="flex h-full flex-col justify-between rounded-lg border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/50 hover:shadow-md">
                <div>
                  <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors">{ws.name}</h3>
                  {ws.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{ws.description}</p>
                  )}
                </div>
                <div className="mt-6 flex items-center text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  View Projects
                  <svg className="ml-1" width="16" height="16" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
                    <path fill="currentColor" d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"/>
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
