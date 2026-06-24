import { ReactNode } from "react";
import Link from "next/link";
import { WorkspaceSwitcher } from "~/components/workspace-switcher";
import { api } from "~/trpc/server";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const p = await params;
  
  // Validate that the user is authed and in an organization.
  // We can fetch user orgs here if we want to show an Org Switcher as well.
  
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground">
      {/* Global Nav */}
      <nav className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border/40 bg-background px-6">
        <div className="flex items-center gap-4">
          <Link href={`/${p.orgSlug}/workspaces`} className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <div className="h-5 w-5 rounded bg-primary" />
            <span className="font-semibold tracking-tight">ShipFlow</span>
          </Link>

          <span className="text-muted-foreground/50">/</span>
          
          <WorkspaceSwitcher />
        </div>
        
        <div className="flex items-center gap-4">
          {/* User profile / Settings can go here */}
          <div className="h-8 w-8 rounded-full bg-muted border border-border"></div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
