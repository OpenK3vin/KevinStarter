import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";
import { examples } from "@/db/schema";
import { desc } from "drizzle-orm";
import { z } from "zod";

/**
 * Example of a TanStack Start server function (GET).
 * This runs securely on the server and is callable from the client.
 */
export const getExamples = createServerFn({ method: "GET" }).handler(
  async () => {
    return await db.select().from(examples).orderBy(desc(examples.createdAt));
  },
);

/**
 * Example of a TanStack Start server function (POST) with Zod validation.
 */
export const createExample = createServerFn({ method: "POST" })
  .validator((data: { name: string; description?: string }) => {
    return z
      .object({
        name: z.string().min(1),
        description: z.string().optional(),
      })
      .parse(data);
  })
  .handler(async ({ data }) => {
    const newId = crypto.randomUUID();

    await db.insert(examples).values({
      id: newId,
      name: data.name,
      description: data.description ?? null,
      createdAt: new Date(),
    });

    return { id: newId };
  });
