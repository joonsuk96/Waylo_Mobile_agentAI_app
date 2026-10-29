import {
  resolveTripLocations,
  purgeExpiredLocations,
} from "../../inngest/resolve-trip-locations";
import { generateTrip } from "../../inngest/generate-trip";
import { serve } from "inngest/edge";
import { inngest } from "../../inngest/client";
import { syncClerkUser } from "../../inngest/functions";

const handler = serve({
  client: inngest,
  functions: [
    syncClerkUser,
    generateTrip,
    resolveTripLocations,
    purgeExpiredLocations,
  ],
  servePath: "/api/inngest",
});
export const GET = handler;
export const POST = handler;
export const PUT = handler;
