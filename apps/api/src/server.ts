import express from "express";
import { logger } from "@repo/logger";
import cors from "cors";

import * as trpcExpress from "@trpc/server/adapters/express";
import { generateOpenApiDocument, createOpenApiExpressMiddleware } from "trpc-to-openapi";
import { apiReference } from "@scalar/express-api-reference";

import { serverRouter, createContext } from "@repo/trpc/server";
import { auth } from "@repo/auth";
import { serve } from "inngest/express";
import { inngest } from "@repo/inngest";
import { allFunctions } from "@repo/inngest/functions";

import { env } from "./env";

export const app = express();

const openApiDocument = generateOpenApiDocument(serverRouter, {
  title: "ShipFlow AI — API",
  version: "1.0.0",
  baseUrl: env.BASE_URL.concat("/api"),
});

// ─── CORS ────────────────────────────────────────────────────
if (env.NODE_ENV !== "prod") {
  app.use(
    cors({
      origin: process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",") ?? ["http://localhost:3000"],
      credentials: true,
    }),
  );
}

app.use(express.json());

// ─── Health ──────────────────────────────────────────────────
app.get("/", (_req, res) => {
  return res.json({ message: "ShipFlow AI is up and running..." });
});

app.get("/health", (_req, res) => {
  return res.json({ message: "ShipFlow AI server is healthy", healthy: true });
});

// ─── OpenAPI Docs ────────────────────────────────────────────
logger.debug(`openapi.json: ${env.BASE_URL}/openapi.json`);
app.get("/openapi.json", (_req, res) => {
  return res.json(openApiDocument);
});

logger.debug(`docs: ${env.BASE_URL}/docs`);
app.use("/docs", apiReference({ url: "/openapi.json" }));

// ─── BetterAuth ──────────────────────────────────────────────
// Mount BetterAuth handler — handles all /api/auth/* routes
app.all("/api/auth/*splat", (req, res) => {
  return auth.handler(req, res);
});

// ─── Inngest ─────────────────────────────────────────────────
// Mount Inngest serve endpoint for self-hosted Inngest dev server
app.use(
  "/api/inngest",
  serve({
    client: inngest,
    functions: allFunctions,
  }),
);

// ─── REST API (OpenAPI) ──────────────────────────────────────
app.use(
  "/api",
  createOpenApiExpressMiddleware({
    router: serverRouter,
    createContext,
  }),
);

// ─── tRPC ────────────────────────────────────────────────────
app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: serverRouter,
    createContext,
  }),
);

export default app;
