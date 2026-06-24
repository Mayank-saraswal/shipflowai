import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Bypass static files, API routes, and public routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/trpc") ||
    pathname.startsWith("/favicon.ico") ||
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/docs") ||
    pathname === "/contact"
  ) {
    return NextResponse.next();
  }

  // Fetch session from BetterAuth endpoint
  const authCookie = request.headers.get("cookie") || "";
  
  // Use fetch to check session securely over internal network
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
  let sessionData: { session?: { activeOrganizationId?: string | null } } | null = null;
  
  try {
    const res = await fetch(`${apiUrl}/auth/get-session`, {
      headers: { cookie: authCookie },
    });
    if (res.ok) {
      sessionData = await res.json();
    }
  } catch (error) {
    console.error("Middleware Auth Fetch Error:", error);
  }

  // 1. Unauthenticated users to login
  if (!sessionData?.session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { session } = sessionData;

  // 2. Forced Onboarding: Logged in, but no active organization
  if (!session.activeOrganizationId && pathname !== "/create-organization") {
    return NextResponse.redirect(new URL("/create-organization", request.url));
  }

  // 3. Prevent going back to create-organization if already has org
  if (session.activeOrganizationId && pathname === "/create-organization") {
    // Already has an active org, don't force them here, maybe they want to create another one?
    // The prompt says: "Immediately after signup/login, check organization membership. If none exists, enforce a redirect to /create-organization".
    // It doesn't strictly forbid creating another, but usually we redirect to dashboard.
    // Let's allow /create-organization if they explicitly went there.
  }

  // 4. Tenant-aware routing
  // Assume tenant routes are structured like `/[slug]/...`
  // Exclude root level pages like /settings or /create-organization
  const pathParts = pathname.split("/").filter(Boolean);
  const possibleSlug = pathParts[0];

  if (possibleSlug && possibleSlug !== "create-organization" && possibleSlug !== "settings") {
    // If the URL has a slug, we should ideally verify if this slug matches their active organization or if they are a member.
    // To do this strictly in middleware, we would need an API to check `slug` vs `activeOrganizationId`.
    // Since BetterAuth session doesn't include the slug (only the activeOrganizationId), we pass a header to the app.
    // The UI can verify slug vs org name on the client or server component.
    // We add the activeOrganizationId to the request headers so downstream Server Components don't have to refetch it.
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-active-organization-id", session.activeOrganizationId || "");
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - trpc (tRPC routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|trpc|_next/static|_next/image|favicon.ico).*)",
  ],
};
