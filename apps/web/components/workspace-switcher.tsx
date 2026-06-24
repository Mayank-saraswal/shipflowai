"use client";

import { useState } from "react";
import { trpc as api } from "~/trpc/client";
import { useRouter, useParams } from "next/navigation";

export function WorkspaceSwitcher() {
  const { orgSlug, workspaceSlug } = useParams();
  const router = useRouter();

  const { data: workspaces, isLoading } = api.workspace.list.useQuery({ limit: 20 });
  const [isOpen, setIsOpen] = useState(false);

  if (isLoading) {
    return <div className="h-9 w-48 animate-pulse rounded-md bg-muted"></div>;
  }

  const currentWorkspace = workspaces?.items.find((w: { slug: string; name: string }) => w.slug === workspaceSlug);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-9 items-center justify-between space-x-3 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-muted"
      >
        <span>{currentWorkspace ? currentWorkspace.name : "Select Workspace"}</span>
        {/* Placeholder for Phosphor CaretDown icon fetched from iconsclub or baked in */}
        <svg width="12" height="12" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
          <path fill="currentColor" d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"/>
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-56 rounded-md border border-border bg-background shadow-lg z-50">
          <div className="py-1">
            {workspaces?.items.map((ws: { id: string; name: string; slug: string }) => (
              <button
                key={ws.id}
                onClick={() => {
                  setIsOpen(false);
                  router.push(`/${orgSlug}/${ws.slug}/projects`);
                }}
                className="flex w-full items-center px-4 py-2 text-sm text-foreground hover:bg-muted"
              >
                {ws.name}
              </button>
            ))}
            <div className="border-t border-border"></div>
            <button
              onClick={() => {
                setIsOpen(false);
                router.push(`/${orgSlug}/workspaces/new`);
              }}
              className="flex w-full items-center px-4 py-2 text-sm text-primary hover:bg-muted"
            >
              + Create Workspace
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
