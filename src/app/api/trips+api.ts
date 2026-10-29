import { createTripSchema } from "../../lib/trip-contract";
import { requireUser } from "../../server/session";
import { apiError, HttpError, json, jsonBody } from "../../server/http";
import { reserveTrip, listTrips, findTrip } from "../../server/trips";
import { checkGenerationConfig, queueTrip } from "../../server/queue-trip";

export async function GET(request: Request) {
  try {
    return json({ trips: await listTrips(await requireUser(request)) });
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(request: Request) {
  try {
    const userId = await requireUser(request);
    checkGenerationConfig();
    const parsed = createTripSchema.safeParse(await jsonBody(request));
    if (!parsed.success)
      throw new HttpError(
        400,
        "목적지·날짜·인원 등 여행 조건을 다시 확인해 주세요.",
      );
    const trip = await reserveTrip(
      userId,
      parsed.data.input,
      parsed.data.requestId,
    );
    await queueTrip(trip);
    return json({ trip: await findTrip(trip.id, userId) }, 201);
  } catch (e) {
    return apiError(e);
  }
}
