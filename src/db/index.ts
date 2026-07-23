import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"

import postgres from "postgres"

import * as schema from "./schema"

const MIGRATIONS_PATH = "./src/db/migrations"

// Singleton PostgreSQL connection — reused across server function calls
const queryClient = postgres(process.env.DATABASE_URL as string, { max: 1 })

export const db = drizzle(queryClient, { schema })

/**
 * Run pending migrations on startup.
 * Called automatically by TanStack Start's server entry point.
 *
 * To apply migrations manually:
 *   pnpm db:migrate
 */
export function runMigrations() {
  migrate(db, { migrationsFolder: MIGRATIONS_PATH })
}
