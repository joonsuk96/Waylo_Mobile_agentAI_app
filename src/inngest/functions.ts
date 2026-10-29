import { sql } from "drizzle-orm";
import { NonRetriableError } from "inngest";
import { getDb } from "../db";
import { users } from "../db/schema";
import { isClerkUserEvent, userRecord } from "../server/clerk-event";
import { inngest } from "./client";

export const syncClerkUser = inngest.createFunction(
  {
    id: "sync-clerk-user",
    name: "Sync Clerk user to Neon",
    triggers: { event: "clerk/user.sync" },
    retries: 4,
  },
  async ({ event, step }) => {
    const payload: unknown = event.data.payload;
    if (!isClerkUserEvent(payload)) throw new NonRetriableError("Invalid Clerk user event");
    return step.run("upsert-neon-user", async () => {
      const record = userRecord(payload);
      const db = getDb();
      // A deleted user is retained as an empty tombstone so older retries cannot restore it.
      const result = await db.insert(users).values(record).onConflictDoUpdate({
        target: users.id,
        set: {
          email: record.email, name: record.name, imageUrl: record.imageUrl,
          updatedAt: new Date(), clerkUpdatedAt: record.clerkUpdatedAt,
          deletedAt: record.deletedAt,
        },
        setWhere: sql`${users.clerkUpdatedAt} < ${record.clerkUpdatedAt}`,
      }).returning({ id: users.id });
      return { status: result.length ? "synced" : "already-current", type: payload.type };
    });
  },
);
