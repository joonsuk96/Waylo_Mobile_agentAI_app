import { z } from "zod";
import { inngest } from "./client";
import { serverSql } from "../server/database";
import { geocode } from "../server/geocoding";
import { tripPlaces } from "../lib/trip-places";
import type { Trip } from "../lib/trip-contract";
import type { TripLocationPoint } from "../lib/trip-locations";

const eventData = z.object({
  tripId: z.string().uuid(),
  jobId: z.string().uuid(),
  attemptId: z.string().uuid(),
});
export const resolveTripLocations = inngest.createFunction(
  {
    id: "resolve-trip-locations",
    name: "여행 장소 위치 찾기",
    triggers: { event: "trip/locations.requested" },
    retries: 2,
    idempotency: "event.data.jobId",
    onFailure: async ({ event, step }) => {
      const { tripId, jobId } = eventData.parse(event.data.event.data);
      await step.run("fail-map-locations", async () => {
        await serverSql()`UPDATE trip_locations SET status='failed',error_message='장소 위치를 찾지 못했어요. 지도 위치를 다시 불러와 주세요.',updated_at=now() WHERE trip_id=${tripId} AND job_id=${jobId}`;
      });
    },
  },
  async ({ event, step }) => {
    const { tripId, jobId, attemptId } = eventData.parse(event.data);
    const trip = await step.run("claim-location-job", async () => {
      const sql = serverSql();
      const rows =
        await sql`SELECT t.* FROM trips t JOIN trip_locations l ON l.trip_id=t.id WHERE t.id=${tripId} AND t.attempt_id=${attemptId} AND t.status='ready' AND l.job_id=${jobId}`;
      if (!rows[0]) return null;
      await sql`UPDATE trip_locations SET status='resolving',updated_at=now() WHERE trip_id=${tripId} AND job_id=${jobId}`;
      return rows[0] as Trip;
    });
    if (!trip?.itinerary) return { status: "skipped" };
    const center = await step.run("lookup-destination", () =>
      geocode(trip.input.destination),
    );
    await step.run("publish-map-center", async () => {
      await serverSql()`UPDATE trip_locations SET center=${JSON.stringify(center?.center ?? null)}::jsonb,updated_at=now() WHERE trip_id=${tripId} AND job_id=${jobId}`;
    });
    const places = tripPlaces(trip.itinerary),
      points: TripLocationPoint[] = [];
    const queries = new Map<string, typeof places>();
    for (const p of places) {
      const query = `${p.location || p.name}`.replace(/\s+/g, " ").trim();
      queries.set(query, [...(queries.get(query) ?? []), p]);
    }
    let index = 0;
    for (const [query, matches] of queries) {
      const location = await step.run(`lookup-place-${++index}`, () =>
        center ? geocode(query, center.center) : Promise.resolve(null),
      );
      if (location && !location.coarse) {
        for (const p of matches)
          points.push({
            number: p.number,
            latitude: location.latitude,
            longitude: location.longitude,
            placeId: location.placeId,
          });
      }
      // Publish progressively so existing trips get markers while other lookups continue.
      await step.run(`publish-place-${index}`, async () => {
        await serverSql()`UPDATE trip_locations SET points=${JSON.stringify(points)}::jsonb,updated_at=now() WHERE trip_id=${tripId} AND job_id=${jobId}`;
      });
    }
    const unresolved = places.length - points.length;
    await step.run("finish-map-locations", async () => {
      await serverSql()`UPDATE trip_locations SET status=${unresolved ? "partial" : "ready"},points=${JSON.stringify(points)}::jsonb,unresolved=${unresolved},updated_at=now() WHERE trip_id=${tripId} AND job_id=${jobId}`;
    });
    return { resolved: points.length, unresolved };
  },
);
export const purgeExpiredLocations = inngest.createFunction(
  {
    id: "purge-expired-trip-locations",
    name: "만료된 지도 좌표 정리",
    triggers: { cron: "0 */6 * * *" },
  },
  async ({ step }) => {
    await step.run("purge", async () => {
      await serverSql()`DELETE FROM trip_locations WHERE expires_at<=now()`;
    });
    return { status: "cleaned" };
  },
);
