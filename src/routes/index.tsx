import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { zodValidator } from '@tanstack/zod-adapter'
import { HomePage } from '@/features/example/components/HomePage'

/**
 * Search params are validated with Zod.
 * Add your own params here — they become fully type-safe via TanStack Router.
 */
const searchSchema = z.object({
  tab: z.string().optional(),
})

export const Route = createFileRoute('/')(({
  component: HomePage,
  validateSearch: zodValidator(searchSchema),
}))
