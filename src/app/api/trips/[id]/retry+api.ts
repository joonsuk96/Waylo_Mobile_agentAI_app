import { requireUser } from "../../../../server/session";
import { apiError, json } from "../../../../server/http";
import { retryTrip, findTrip } from "../../../../server/trips";
import {
  checkGenerationConfig,
  queueTrip,
} from "../../../../server/queue-trip";

export async function POST(request: Request, { id }: { id: string }) {
  try {
    const userId = await requireUser(request);
    checkGenerationConfig();
    const trip = await retryTrip(id, userId);
    await queueTrip(trip);
    return json({ trip: await findTrip(id, userId) });
  } catch (e) {
    return apiError(e);
  }
}
