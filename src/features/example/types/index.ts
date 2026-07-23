/**
 * Domain types for the example feature.
 *
 * Replace with your own domain model.
 * Follow the pattern: plain TypeScript interfaces + Zod schemas for validation.
 */

export interface Example {
  id: string
  name: string
  description: string | null
  createdAt: number
}

export type CreateExampleInput = Pick<Example, "name" | "description">
export type UpdateExampleInput = Partial<Pick<Example, "name" | "description">>
