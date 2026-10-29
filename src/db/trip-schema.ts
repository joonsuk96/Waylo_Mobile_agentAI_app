import {
  boolean,
  date,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./schema";
import type { TripInput, Itinerary, Cover } from "../lib/trip-contract";
export const trips = pgTable(
  "trips",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    requestId: text("request_id").notNull(),
    attemptId: text("attempt_id").notNull(),
    input: jsonb("input").$type<TripInput>().notNull(),
    numDays: integer("num_days").notNull(),
    status: text("status").notNull(),
    itinerary: jsonb("itinerary").$type<Itinerary>(),
    cover: jsonb("cover").$type<Cover>(),
    budgetBreakdown:
      jsonb("budget_breakdown").$type<Itinerary["budgetBreakdown"]>(),
    errorMessage: text("error_message"),
    usageDay: date("usage_day").notNull(),
    quotaCharged: boolean("quota_charged").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("trips_user_request_unique").on(table.userId, table.requestId),
  ],
);
export const generationUsage = pgTable(
  "generation_usage",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    day: date("day").notNull(),
    count: integer("count").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.userId, t.day] })],
);
