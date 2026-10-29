require("dotenv").config({ quiet: true });
const { neon } = require("@neondatabase/serverless");
async function main() {
  if (!process.env.DATABASE_URL) throw Error("DATABASE_URL is missing");
  const sql = neon(process.env.DATABASE_URL);
  await sql`CREATE TABLE IF NOT EXISTS generation_usage (
    user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day date NOT NULL, count integer NOT NULL DEFAULT 0 CHECK(count>=0), PRIMARY KEY(user_id,day)
  )`;
  await sql`CREATE TABLE IF NOT EXISTS trips (
    id text PRIMARY KEY,user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_id text NOT NULL,attempt_id text NOT NULL,input jsonb NOT NULL,num_days integer NOT NULL CHECK(num_days BETWEEN 1 AND 30),
    status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','generating','ready','failed')),
    itinerary jsonb,cover jsonb,budget_breakdown jsonb,error_message text,
    usage_day date NOT NULL,quota_charged boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(user_id,request_id)
  )`;
  await sql`CREATE INDEX IF NOT EXISTS trips_user_created_idx ON trips(user_id,created_at DESC)`;
  console.log(
    "Trips and generation_usage tables are ready. No existing tables or rows were deleted.",
  );
}
main().catch((e) => {
  console.error(
    "Trip database setup failed. Check DATABASE_URL and existing table schemas. Code:",
    e.code ?? e.name,
  );
  process.exitCode = 1;
});
