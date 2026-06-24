import { Router } from "express";
import crypto from "crypto";
import { inngest } from "@repo/inngest";
import { EVENTS } from "@repo/events";

export const githubWebhookRouter = Router();

// We must use express.raw to preserve the raw body for HMAC signature validation
// We assume this middleware is mounted BEFORE express.json() for this specific route,
// or we just handle body parsing here.

githubWebhookRouter.post("/", async (req, res) => {
  const signature = req.headers["x-hub-signature-256"] as string;
  const event = req.headers["x-github-event"] as string;
  const deliveryId = req.headers["x-github-delivery"] as string;

  if (!signature || !event || !deliveryId) {
    return res.status(400).send("Missing required headers");
  }

  // Validate signature
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("GITHUB_WEBHOOK_SECRET is not set");
    return res.status(500).send("Server misconfiguration");
  }

  // Expects req.body to be a Buffer (because we use express.raw({ type: 'application/json' }) where it's mounted)
  if (!Buffer.isBuffer(req.body)) {
    return res.status(500).send("Body is not a buffer. Ensure express.raw() is used.");
  }

  const hmac = crypto.createHmac("sha256", webhookSecret);
  const digest = "sha256=" + hmac.update(req.body).digest("hex");

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
    return res.status(401).send("Invalid signature");
  }

  let payload;
  try {
    payload = JSON.parse(req.body.toString("utf-8"));
  } catch (e) {
    return res.status(400).send("Invalid JSON body");
  }

  const action = payload.action;
  const installationId = payload.installation?.id;

  // Fire-and-forget to Inngest
  // We use the deliveryId as the deduplication key so Inngest only processes it once
  await inngest.send({
    name: EVENTS.GITHUB_WEBHOOK_RECEIVED,
    data: {
      event,
      action,
      installationId,
      deliveryId,
      payload,
    },
    // We don't have user_id, just deduplicate by deliveryId
  });

  return res.status(202).send("Accepted");
});
