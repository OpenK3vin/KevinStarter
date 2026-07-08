import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as schema from './schema'

const DB_PATH = './sqlite.db'
const MIGRATIONS_PATH = './src/db/migrations'

// Singleton SQLite connection — reused across server function calls
const sqlite = new Database(DB_PATH)

// Enable WAL mode for better concurrent read performance
sqlite.pragma('journal_mode = WAL')

export const db = drizzle(sqlite, { schema })

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
