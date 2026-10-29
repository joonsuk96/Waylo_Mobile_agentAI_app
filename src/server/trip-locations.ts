import { randomUUID } from "node:crypto";
import { findTrip } from "./trips";
import { serverSql } from "./database";
import { HttpError } from "./http";
import { inngest } from "../inngest/client";
import type { TripLocations } from "../lib/trip-locations";

export async function locationState(id: string): Promise<TripLocations | null> {
  // Keep coordinate caches shorter than 30 days. Expired results are not returned.
  const rows =
    await serverSql()`SELECT status,center,points,unresolved,error_message AS error FROM trip_locations WHERE trip_id=${id} AND expires_at>now()`;
  return (rows[0] as TripLocations | undefined) ?? null;
}
export async function requestLocations(
  id: string,
  userId: string,
  retry: boolean,
) {
  const trip = await findTrip(id, userId);
  if (trip.status !== "ready")
    throw new HttpError(409, "여행 생성이 끝난 뒤 지도를 준비할 수 있어요.");
  const current = await locationState(id);
  if (current && !retry) return current;
  const jobId = randomUUID();
  const rows =
    await serverSql()`INSERT INTO trip_locations(trip_id,attempt_id,job_id,status)
    VALUES(${id},${trip.attempt_id},${jobId},'pending') ON CONFLICT(trip_id) DO UPDATE
    SET attempt_id=EXCLUDED.attempt_id,job_id=EXCLUDED.job_id,status='pending',center=null,points='[]'::jsonb,unresolved=0,error_message=null,updated_at=now(),expires_at=now()+interval '29 days'
    WHERE trip_locations.attempt_id<>EXCLUDED.attempt_id OR trip_locations.expires_at<=now() OR (${retry} AND trip_locations.status IN ('failed','partial') AND trip_locations.updated_at<now()-interval '5 seconds')
    RETURNING job_id`;
  if (rows.length) {
    try {
      await inngest.send({
        id: `locations-${jobId}`,
        name: "trip/locations.requested",
        data: { tripId: id, jobId, attemptId: trip.attempt_id },
      });
    } catch {
      await serverSql()`UPDATE trip_locations SET status='failed',error_message='위치 조회를 시작하지 못했어요. Inngest 연결을 확인해 주세요.',updated_at=now() WHERE trip_id=${id} AND job_id=${jobId}`;
    }
  }
  return await locationState(id);
}
