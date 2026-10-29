import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { requireServerEnv } from "../server/env";
import * as schema from "./schema";

export function getDb() {
  return drizzle(neon(requireServerEnv("DATABASE_URL")), { schema });
}
