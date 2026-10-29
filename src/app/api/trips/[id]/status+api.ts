import { requireUser } from "../../../../server/session";
import { apiError, json } from "../../../../server/http";
import { findTrip } from "../../../../server/trips";

export async function GET(request: Request, { id }: { id: string }) {
  try {
    const trip = await findTrip(id, await requireUser(request));
    return json({
      id: trip.id,
      status: trip.status,
      destination: trip.input.destination,
      numDays: trip.num_days,
      numTravelers: trip.input.numTravelers,
      error: trip.error_message,
      updatedAt: trip.updated_at,
    });
  } catch (e) {
    return apiError(e);
  }
}
