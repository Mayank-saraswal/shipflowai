/**
 * ShipFlow AI — AI SDK Wrapper
 *
 * Model-agnostic factory layer on top of Vercel AI SDK.
 * All AI calls in the application go through this package so the model
 * provider can be swapped (OpenAI → Anthropic → Gemini) without touching
 * business logic in inngest functions or tRPC routes.
 *
 * Design:
 * - `getModel()` returns a configured LanguageModel ready for `generateText`/`streamText`
 * - Agent-specific functions live in ./agents/ and are exported from here
 * - Mem0 context is injected via @repo/mem0 where needed
 */

import { createOpenAI } from "@ai-sdk/openai";

// ─── Model Configuration ────────────────────────────────────

type ModelId = "gpt-4o" | "gpt-4o-mini" | "gpt-4-turbo" | "o1-mini";

interface ModelConfig {
  apiKey?: string;
  modelId?: ModelId;
}

const DEFAULT_MODEL: ModelId = "gpt-4o-mini";

/**
 * Returns a configured Vercel AI SDK LanguageModel instance.
 * Defaults to gpt-4o-mini for cost efficiency in dev.
 */
export function getModel(config?: ModelConfig) {
  const openai = createOpenAI({
    apiKey: config?.apiKey ?? process.env.OPENAI_API_KEY ?? "",
  });

  return openai(config?.modelId ?? DEFAULT_MODEL);
}

/**
 * Returns a high-capability model for complex tasks (PRD generation, code review).
 */
export function getStrongModel(config?: ModelConfig) {
  return getModel({ ...config, modelId: config?.modelId ?? "gpt-4o" });
}

/**
 * Returns a fast/cheap model for simple tasks (clarification, classification).
 */
export function getFastModel(config?: ModelConfig) {
  return getModel({ ...config, modelId: config?.modelId ?? "gpt-4o-mini" });
}

/**
 * Returns a configured embedding model (locked to a specific model to maintain vector space consistency).
 */
export function getEmbeddingModel() {
  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY ?? "",
  });
  return openai.embedding("text-embedding-3-small");
}

// ─── Re-exports ──────────────────────────────────────────────
export { generateText, streamText, generateObject, embed, embedMany } from "ai";
export type { LanguageModel, CoreMessage } from "ai";
export * from "./agents/clarification";
