import { Webhook } from "svix";
import { inngest } from "../../../inngest/client";
import { isClerkUserEvent } from "../../../server/clerk-event";
import { requireServerEnv } from "../../../server/env";

export async function POST(request: Request) {
  let secret: string;
  try {
    secret = requireServerEnv("CLERK_WEBHOOK_SIGNING_SECRET");
  } catch {
    console.error("[clerk-webhook] CLERK_WEBHOOK_SIGNING_SECRET is missing");
    return Response.json({ error: "Webhook signing secret is not configured" }, { status: 503 });
  }
  const id = request.headers.get("svix-id");
  const timestamp = request.headers.get("svix-timestamp");
  const signature = request.headers.get("svix-signature");
  if (!id || !timestamp || !signature) {
    return Response.json({ error: "Missing webhook signature headers" }, { status: 400 });
  }
  let payload: unknown;
  try {
    const body = await request.text();
    new Webhook(secret).verify(body, {
      "svix-id": id, "svix-timestamp": timestamp, "svix-signature": signature,
    });
    // Svix 2 verifies the raw bytes but does not return parsed JSON.
    payload = JSON.parse(body);
  } catch {
    return Response.json({ error: "Invalid webhook signature or payload" }, { status: 400 });
  }
  const type = (payload as { type?: unknown })?.type;
  if (!["user.created", "user.updated", "user.deleted"].includes(String(type))) {
    return Response.json({ status: "ignored" });
  }
  if (!isClerkUserEvent(payload)) {
    return Response.json({ error: "Invalid user event" }, { status: 400 });
  }
  try {
    const result = await inngest.send({ id, name: "clerk/user.sync", data: { payload } });
    console.info(`[clerk-webhook] ${payload.type} queued`);
    return Response.json({ status: "queued", eventIds: result.ids });
  } catch {
    console.error("[clerk-webhook] Inngest delivery failed; check the dev server on port 8288");
    // Clerk retries non-2xx deliveries; never acknowledge an event we failed to queue.
    return Response.json({ error: "Could not queue event. Is Inngest running?" }, { status: 503 });
  }
}
