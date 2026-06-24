import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

/**
 * ShipFlow AI — BetterAuth client for the Next.js frontend
 *
 * This client is used in React components and hooks.
 * The `baseURL` points to the Express API server where BetterAuth is mounted.
 *
 * The organization plugin client enables:
 * - Creating organizations
 * - Listing user's organizations
 * - Setting active organization
 * - Inviting members
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
  plugins: [organizationClient()],
});

export type AuthClient = typeof authClient;
