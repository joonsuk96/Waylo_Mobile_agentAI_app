import { requireUser } from "../../../server/session";
import { apiError, json } from "../../../server/http";
import { deleteTrip, findTrip } from "../../../server/trips";

export async function GET(request: Request, { id }: { id: string }) {
  try {
    return json({ trip: await findTrip(id, await requireUser(request)) });
  } catch (e) {
    return apiError(e);
  }
}

export async function DELETE(request: Request, { id }: { id: string }) {
  try {
    return json({
      deletedId: await deleteTrip(id, await requireUser(request)),
    });
  } catch (e) {
    return apiError(e);
  }
}
