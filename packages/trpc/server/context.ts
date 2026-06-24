import { auth } from "@repo/auth";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";

export async function createContext({ req, res }: CreateExpressContextOptions) {
  // BetterAuth can parse the standard node/express headers
  // We need to convert express headers to web Headers object if BetterAuth expects it,
  // but BetterAuth provides a helper or accepts node headers directly in many cases.
  // Using standard Web Headers is safest:
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      value.forEach((v) => headers.append(key, v));
    } else if (value) {
      headers.set(key, value);
    }
  }

  const sessionData = await auth.api.getSession({
    headers,
  });

  return {
    req,
    res,
    user: sessionData?.user ?? null,
    session: sessionData?.session ?? null,
    organizationId: sessionData?.session?.activeOrganizationId ?? null,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
