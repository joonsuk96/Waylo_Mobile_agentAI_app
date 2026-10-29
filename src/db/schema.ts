import { bigint, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email"),
  name: text("name"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  clerkUpdatedAt: bigint("clerk_updated_at", { mode: "number" }).notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});
