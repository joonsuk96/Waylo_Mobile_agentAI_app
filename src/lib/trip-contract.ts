import { z } from "zod";
import { daysInclusive } from "./calendar";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((v) => {
    const d = new Date(v + "T00:00:00Z");
    return Number.isFinite(+d) && d.toISOString().slice(0, 10) === v;
  }, "올바른 날짜를 선택해 주세요.");
export const tripInputSchema = z
  .object({
    destination: z.string().trim().min(1).max(100),
    startDate: isoDate,
    endDate: isoDate,
    numTravelers: z.number().int().min(1).max(20),
    budgetTier: z.enum(["low", "medium", "luxury"]),
    interests: z.array(z.string().trim().min(1).max(30)).max(10),
    pace: z.enum(["relaxed", "balanced", "fast"]),
  })
  .refine((v) => {
    const n = daysInclusive(v.startDate, v.endDate);
    return n >= 1 && n <= 30;
  }, "여행 기간은 1일부터 30일까지 선택해 주세요.");
export const createTripSchema = z.object({
  input: tripInputSchema,
  requestId: z.string().uuid(),
});
const money = z.number().int().nonnegative();
export const itinerarySchema = z.object({
  title: z.string(),
  summary: z.string(),
  imageQuery: z.string(),
  days: z
    .array(
      z.object({
        day: z.number().int().min(1),
        date: isoDate,
        title: z.string(),
        activities: z
          .array(
            z.object({
              time: z.enum(["아침", "오후", "저녁"]),
              name: z.string(),
              description: z.string(),
              location: z.string(),
              latitude: z.number().min(-90).max(90).nullable(),
              longitude: z.number().min(-180).max(180).nullable(),
              estimatedCostKrw: money,
            }),
          )
          .min(1)
          .max(6),
      }),
    )
    .min(1)
    .max(30),
  hotels: z
    .array(
      z.object({
        name: z.string(),
        area: z.string(),
        description: z.string(),
        estimatedNightlyKrw: money,
      }),
    )
    .max(3),
  budgetBreakdown: z.object({
    currency: z.literal("KRW"),
    scope: z.literal("total_group"),
    accommodation: money,
    food: money,
    transport: money,
    activities: money,
    other: money,
  }),
  tips: z.array(z.string()).max(8),
});
export type TripInput = z.infer<typeof tripInputSchema>;
export type Itinerary = z.infer<typeof itinerarySchema>;
export type Cover = {
  url: string;
  photographer: string | null;
  photographerUrl: string | null;
  photoUrl: string | null;
  provider: "unsplash" | "imagekit";
};
export type TripStatus = "pending" | "generating" | "ready" | "failed";
export type Trip = {
  id: string;
  user_id: string;
  input: TripInput;
  num_days: number;
  status: TripStatus;
  itinerary: Itinerary | null;
  cover: Cover | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  attempt_id: string;
  request_id: string;
  usage_day: string;
  quota_charged: boolean;
};
export function totalBudget(i: Itinerary) {
  const b = i.budgetBreakdown;
  return b.accommodation + b.food + b.transport + b.activities + b.other;
}
export function validateItinerary(value: unknown, input: TripInput) {
  const parsed = itinerarySchema.parse(value);
  const count = daysInclusive(input.startDate, input.endDate);
  if (parsed.days.length !== count)
    throw Error("AI itinerary day count mismatch");
  for (let n = 0; n < count; n++) {
    const date = new Date(input.startDate + "T00:00:00Z");
    date.setUTCDate(date.getUTCDate() + n);
    if (
      parsed.days[n].day !== n + 1 ||
      parsed.days[n].date !== date.toISOString().slice(0, 10)
    )
      throw Error("AI itinerary dates mismatch");
  }
  return parsed;
}
