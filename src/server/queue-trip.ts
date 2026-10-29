import type { Trip } from "../lib/trip-contract";
import { inngest } from "../inngest/client";
import { failTrip } from "./trips";
import { HttpError } from "./http";

export function checkGenerationConfig() {
  const missing = ["OPENAI_API_KEY", "UNSPLASH_ACCESS_KEY"].filter(
    (name) => !process.env[name]?.trim(),
  );
  if (missing.length)
    throw new HttpError(
      503,
      `서버 환경변수를 설정해 주세요: ${missing.join(", ")}`,
    );
}
export async function queueTrip(trip: Trip) {
  if (trip.status !== "pending") return;
  try {
    await inngest.send({
      id: `trip-${trip.attempt_id}`,
      name: "trip/generate",
      data: { tripId: trip.id, attemptId: trip.attempt_id },
    });
  } catch {
    await failTrip(
      trip.id,
      trip.attempt_id,
      "Inngest에 연결하지 못했어요. 개발 서버가 켜져 있는지 확인해 주세요.",
    );
  }
}
