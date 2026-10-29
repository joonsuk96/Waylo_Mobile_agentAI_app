import { randomUUID } from "node:crypto";
import type { Cover, Itinerary, Trip, TripInput } from "../lib/trip-contract";
import { daysInclusive } from "../lib/calendar";
import { serverSql } from "./database";
import { HttpError } from "./http";

export async function findTrip(id: string, userId: string) {
  const rows =
    await serverSql()`SELECT * FROM trips WHERE id=${id} AND user_id=${userId}`;
  if (!rows[0]) throw new HttpError(404, "여행을 찾을 수 없어요.");
  return rows[0] as Trip;
}
export async function listTrips(userId: string) {
  return (await serverSql()`SELECT * FROM trips WHERE user_id=${userId} ORDER BY created_at DESC LIMIT 100`) as Trip[];
}

export async function reserveTrip(
  userId: string,
  input: TripInput,
  requestId: string,
) {
  const sql = serverSql();
  const id = randomUUID();
  const attempt = randomUUID();
  // Per-user transaction lock serializes reservations, duplicate requests and refunds.
  const [, rows] = await sql.transaction([
    sql`SELECT pg_advisory_xact_lock(hashtext(${userId}))`,
    sql`WITH existing AS (SELECT * FROM trips WHERE user_id=${userId} AND request_id=${requestId}),
    quota AS (
      INSERT INTO generation_usage(user_id,day,count)
      SELECT ${userId},(now() AT TIME ZONE 'Asia/Seoul')::date,1 WHERE NOT EXISTS(SELECT 1 FROM existing)
      ON CONFLICT(user_id,day) DO UPDATE SET count=generation_usage.count+1 WHERE generation_usage.count<20 RETURNING day
    ), added AS (
      INSERT INTO trips(id,user_id,request_id,attempt_id,input,num_days,status,usage_day,quota_charged)
      SELECT ${id},${userId},${requestId},${attempt},${JSON.stringify(input)}::jsonb,${daysInclusive(input.startDate, input.endDate)},'pending',day,true FROM quota RETURNING *
    ) SELECT * FROM existing UNION ALL SELECT * FROM added`,
  ]);
  if (!rows[0])
    throw new HttpError(
      429,
      "오늘은 여행을 충분히 계획했어요. 내일 다시 시도해 주세요.",
    );
  return rows[0] as Trip;
}

export async function retryTrip(id: string, userId: string) {
  const sql = serverSql();
  const attempt = randomUUID();
  const [, rows] = await sql.transaction([
    sql`SELECT pg_advisory_xact_lock(hashtext(${userId}))`,
    sql`WITH target AS (SELECT * FROM trips WHERE id=${id} AND user_id=${userId} AND status='failed'),
    quota AS (
      INSERT INTO generation_usage(user_id,day,count) SELECT ${userId},(now() AT TIME ZONE 'Asia/Seoul')::date,1 WHERE EXISTS(SELECT 1 FROM target)
      ON CONFLICT(user_id,day) DO UPDATE SET count=generation_usage.count+1 WHERE generation_usage.count<20 RETURNING day
    ) UPDATE trips SET status='pending',attempt_id=${attempt},usage_day=quota.day,quota_charged=true,error_message=null,updated_at=now() FROM quota WHERE trips.id=${id} AND trips.user_id=${userId} AND trips.status='failed' RETURNING trips.*`,
  ]);
  if (rows[0]) return rows[0] as Trip;
  const current = await findTrip(id, userId);
  if (current.status === "failed")
    throw new HttpError(
      429,
      "오늘은 여행을 충분히 계획했어요. 내일 다시 시도해 주세요.",
    );
  return current;
}

export async function failTrip(id: string, attemptId: string, message: string) {
  const sql = serverSql();
  const rows = await sql`SELECT user_id FROM trips WHERE id=${id}`;
  if (!rows[0]) return;
  await sql.transaction([
    sql`SELECT pg_advisory_xact_lock(hashtext(${rows[0].user_id}))`,
    sql`WITH refunded AS (
      UPDATE trips SET status='failed',error_message=${message},quota_charged=false,updated_at=now()
      WHERE id=${id} AND attempt_id=${attemptId} AND status IN ('pending','generating') AND quota_charged=true
      RETURNING user_id,usage_day
    ) UPDATE generation_usage SET count=GREATEST(0,count-1) FROM refunded WHERE generation_usage.user_id=refunded.user_id AND generation_usage.day=refunded.usage_day`,
  ]);
}
export async function claimTrip(id: string, attemptId: string) {
  const rows =
    await serverSql()`UPDATE trips SET status='generating',updated_at=now() WHERE id=${id} AND attempt_id=${attemptId} AND status IN ('pending','generating') RETURNING *`;
  return rows[0] as Trip | undefined;
}
export async function finishTrip(
  id: string,
  attemptId: string,
  itinerary: Itinerary,
  cover: Cover | null,
) {
  await serverSql()`UPDATE trips SET status='ready',itinerary=${JSON.stringify(itinerary)}::jsonb,budget_breakdown=${JSON.stringify(itinerary.budgetBreakdown)}::jsonb,cover=${JSON.stringify(cover)}::jsonb,error_message=null,updated_at=now() WHERE id=${id} AND attempt_id=${attemptId} AND status='generating'`;
}

export async function deleteTrip(id: string, userId: string) {
  const rows =
    await serverSql()`DELETE FROM trips WHERE id=${id} AND user_id=${userId} RETURNING id`;
  if (!rows[0])
    throw new HttpError(
      404,
      "여행을 찾을 수 없어요. 이미 삭제되었을 수 있어요.",
    );
  return rows[0].id as string;
}
