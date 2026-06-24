/**
 * ShipFlow AI — Inngest Client & Function Registry
 *
 * Self-hosted Inngest handles all async/long-running workflows:
 * - PRD generation from clarified feature requests
 * - Task breakdown from approved PRDs
 * - AI code review triggered by GitHub webhooks
 * - Web research pipelines
 * - Notification dispatch
 *
 * Every Inngest function is typed against the ShipFlowEventMap
 * so events are fully type-safe from producer to consumer.
 */

import { Inngest, EventSchemas } from "inngest";
import type { ShipFlowEventMap } from "@repo/events";

// ─── Typed Inngest Client ────────────────────────────────────

export const inngest = new Inngest({
  id: "shipflow-ai",
  schemas: new EventSchemas().fromRecord<ShipFlowEventMap>(),
});

// ─── Re-export for consumers ─────────────────────────────────
export type { ShipFlowEventMap } from "@repo/events";
export { EVENTS } from "@repo/events";
