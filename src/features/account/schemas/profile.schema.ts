import { z } from "zod"

export const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  image: z.string().url("Must be a valid URL").optional().or(z.literal("")),
})

export type ProfileValues = z.infer<typeof profileSchema>
