import { z } from "zod";
import { inngest } from "./client";
import { claimTrip, failTrip, finishTrip } from "../server/trips";
import {
  generateItinerary,
  generateOverview,
  generateDayBatch,
  dayBatches,
} from "../server/openai";
import { findCover } from "../server/images";
import {
  itinerarySchema,
  tripInputSchema,
  validateItinerary,
  type Itinerary,
} from "../lib/trip-contract";

const eventSchema = z.object({
  tripId: z.string().uuid(),
  attemptId: z.string().uuid(),
});
export const generateTrip = inngest.createFunction(
  {
    id: "generate-trip",
    name: "AI 여행 일정 만들기",
    triggers: { event: "trip/generate" },
    retries: 3,
    idempotency: "event.data.attemptId",
    onFailure: async ({ event, step }) => {
      const data = eventSchema.parse(event.data.event.data);
      await step.run("mark-failed-and-refund", () =>
        failTrip(
          data.tripId,
          data.attemptId,
          "여행을 완성하지 못했어요. 잠시 후 다시 시도해 주세요.",
        ),
      );
    },
  },
  async ({ event, step }) => {
    const { tripId, attemptId } = eventSchema.parse(event.data);
    const trip = await step.run("start-generation", () =>
      claimTrip(tripId, attemptId),
    );
    if (!trip) return { status: "skipped" };
    const input = tripInputSchema.parse(trip.input);
    let itinerary: Itinerary;
    const batches = dayBatches(input);
    if (batches.length === 1) {
      const output = await step.run("generate-ai-itinerary", () =>
        generateItinerary(input),
      );
      itinerary = itinerarySchema.parse(output);
    } else {
      const overview = await step.run("generate-trip-overview-v2", () =>
        generateOverview(input),
      );
      const days: Itinerary["days"] = [];
      for (const calendar of batches) {
        const previousPlaces = days.flatMap((day) =>
          day.activities.map((a) => a.name),
        );
        const generated = await step.run(
          `generate-days-${calendar[0].day}-${calendar.at(-1)!.day}-v2`,
          () => generateDayBatch(input, calendar, previousPlaces),
        );
        days.push(...generated);
      }
      itinerary = validateItinerary({ ...overview, days }, input);
    }
    const cover = await step.run("select-travel-cover", () =>
      findCover(itinerary.imageQuery, tripId),
    );
    await step.run("save-completed-trip", () =>
      finishTrip(tripId, attemptId, itinerary, cover),
    );
    return { tripId, status: "ready" };
  },
);
