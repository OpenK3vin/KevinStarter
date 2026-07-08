import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

/**
 * `examples` — starter table to demonstrate the Drizzle + SQLite pattern.
 *
 * Replace or extend this with your own domain tables.
 * Nested objects should be stored as JSON text columns (serialize before
 * insert, parse after select) — see KevinPulse's fuel_price_entries for
 * a real-world example.
 */
export const examples = sqliteTable('examples', {
  /** UUID string — generate with crypto.randomUUID() */
  id: text('id').primaryKey(),

  /** Human-readable name */
  name: text('name').notNull(),

  /** Optional description */
  description: text('description'),

  /** Unix timestamp (ms) — set on insert, never updated */
  createdAt: integer('created_at').notNull(),
})

export type ExampleRow = typeof examples.$inferSelect
export type NewExampleRow = typeof examples.$inferInsert
