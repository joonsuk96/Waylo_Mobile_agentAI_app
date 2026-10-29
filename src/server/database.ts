import { neon } from "@neondatabase/serverless";
import { requireServerEnv } from "./env";
export function serverSql() {
  return neon(requireServerEnv("DATABASE_URL"));
}
