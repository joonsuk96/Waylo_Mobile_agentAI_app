require('dotenv').config({quiet:true});const {neon}=require('@neondatabase/serverless');
async function main(){const sql=neon(process.env.DATABASE_URL);await sql`CREATE TABLE IF NOT EXISTS trip_locations (
  trip_id text PRIMARY KEY REFERENCES trips(id) ON DELETE CASCADE,attempt_id text NOT NULL,job_id text NOT NULL,
  status text NOT NULL CHECK(status IN ('pending','resolving','ready','partial','failed')),center jsonb,points jsonb NOT NULL DEFAULT '[]',
  unresolved integer NOT NULL DEFAULT 0,error_message text,updated_at timestamptz NOT NULL DEFAULT now(),expires_at timestamptz NOT NULL DEFAULT now()+interval '29 days'
)`;console.log('trip_locations is ready. Existing trips were preserved.')}
main().catch(()=>{console.error('Map location table setup failed. Check DATABASE_URL.');process.exitCode=1});
