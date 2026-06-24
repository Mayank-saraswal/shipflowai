import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "./env";
import * as schema from "./schema";

/**
 * Configure explicit connection pool sizes based on production limits.
 * Postgres max_connections is typically 100 default.
 * - API instances: 40
 * - Inngest workers: 40
 * - Buffer/Studio: 20
 */
const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: process.env.DB_MAX_CONNECTIONS ? parseInt(process.env.DB_MAX_CONNECTIONS, 10) : 40,
});

export const db = drizzle(pool, { schema });
export * from "drizzle-orm";
export default db;
