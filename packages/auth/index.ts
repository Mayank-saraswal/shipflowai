import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@repo/db";

// Use native crypto randomUUID for uuidv7-like generation, or rely on Drizzle defaults.
// BetterAuth defaults to standard length strings for IDs. We'll use Drizzle defaults for our own models
// but BetterAuth will generate IDs via its own mechanism for internal tables.

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },

  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      // Send via Resend
      if (!process.env.RESEND_API_KEY) {
        console.log("Mock Email (No RESEND_API_KEY): Verification URL:", url);
        return;
      }
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "onboarding@hedwigs.site",
          to: user.email,
          subject: "Verify your email address",
          html: `<p>Click <a href="${url}">here</a> to verify your email.</p>`,
        }),
      });
    },
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
      schema: {
        organization: {
          modelName: "organizations",
        },
        member: {
          modelName: "memberships",
          fields: {
            role: "role",
            userId: "userId",
            organizationId: "organizationId",
            createdAt: "createdAt",
          }
        },
        invitation: {
          modelName: "invites",
          fields: {
            organizationId: "organizationId",
            inviterId: "inviterId",
            email: "email",
            role: "role",
            status: "status",
            expiresAt: "expiresAt",
          }
        },
      },
      allowUserToCreateOrganization: false, // We will manually handle this to ensure strict atomicity
    }),
  ],

  // Rate Limiting Config
  rateLimit: {
    enabled: true,
    // Provide an Upstash Redis fallback implementation
    storage: "memory", // Let BetterAuth handle rate limits via its internal mechanism or custom DB storage
  },
  
  advanced: {
    // Generate UUIDs handled by database level usually.
  }
});

export type Auth = typeof auth;
export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
