require("dotenv").config({ quiet: true });
const { neon } = require("@neondatabase/serverless");

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is missing in .env");
  const sql = neon(process.env.DATABASE_URL);
  const columns = await sql`SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users'`;
  const expected = ["id", "email", "name", "image_url", "created_at", "updated_at", "clerk_updated_at", "deleted_at"];
  if (columns.length && expected.some(name => !columns.some(c => c.column_name === name))) {
    throw new Error("Existing public.users has a different schema. No changes made; inspect it before migrating.");
  }
  await sql`CREATE TABLE IF NOT EXISTS public.users (
    id text PRIMARY KEY,
    email text,
    name text,
    image_url text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    clerk_updated_at bigint NOT NULL,
    deleted_at timestamptz
  )`;
  console.log("public.users is ready. Existing rows were preserved.");
}
main().catch(() => {
  console.error("Database setup failed. Check DATABASE_URL, network access, and the existing public.users schema. No tables were dropped.");
  process.exitCode = 1;
});
