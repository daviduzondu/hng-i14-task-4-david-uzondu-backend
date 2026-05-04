import { env } from "@hng-i14-task-0-david-uzondu/env/server";
import { Pool } from "pg";

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
});