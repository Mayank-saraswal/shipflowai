import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@repo/db";

/**
 * ShipFlow AI — BetterAuth server instance
 *
 * Mounted on the Express API server at `/api/auth/*`.
 * Uses the organization plugin to enforce the forced-org onboarding flow.
 *
 * Key design decisions:
 * - Organization plugin is enabled so every user can belong to an org
 * - Email/password + GitHub OAuth as social providers
 * - Drizzle adapter connects to the same Postgres used by the rest of the app
 * - trustedOrigins allows the Next.js frontend to make cross-origin auth calls
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),

  emailAndPassword: {
    enabled: true,
  },

  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
    },
  },

  trustedOrigins: (process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? "http://localhost:3000").split(","),

  plugins: [
    organization({
      allowUserToCreateOrganization: true,
    }),
  ],
});

export type Auth = typeof auth;
export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
