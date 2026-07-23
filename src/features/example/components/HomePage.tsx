import { useSuspenseQuery } from "@tanstack/react-query"

import type { ExampleRow } from "@/db/schema"
import { useFeatureFlag } from "@/modules/feature-flags"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { getExamples } from "../api/example"

export function HomePage() {
  // Use TanStack Query to call our server function
  const { data } = useSuspenseQuery({
    queryKey: ["examples"],
    queryFn: () => getExamples(),
  })

  // Access feature flags
  const isExampleFlagEnabled = useFeatureFlag("example")

  return (
    <div className="page-wrap rise-in space-y-8 py-12">
      <header className="space-y-2">
        <h1 className="text-sea-ink text-4xl font-bold">Welcome to Kevin Starter</h1>
        <p className="text-sea-ink-soft text-lg">
          The ultimate boilerplate with TanStack Start, TanStack Router, Tailwind v4, Shadcn, and
          Drizzle SQLite.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Feature Flags</h2>
        <Card className="feature-card border-none">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <span className="font-medium">VITE_FF_EXAMPLE:</span>
              <span className="bg-sea-ink rounded px-2 py-1 text-sm text-white">
                {isExampleFlagEnabled ? "Enabled" : "Disabled"}
              </span>
            </div>
            <p className="text-sea-ink-soft mt-2 text-sm">
              Toggle this flag in your <code>.env</code> file.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Database (Examples Table)</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.length === 0 ? (
            <div className="text-sea-ink-soft border-line col-span-full rounded-xl border border-dashed p-8 text-center">
              No records found. Run a database seed or add some data.
            </div>
          ) : (
            data.map((item: ExampleRow) => (
              <Card key={item.id} className="island-shell border-none">
                <CardHeader>
                  <CardTitle>{item.name}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sea-ink-soft text-sm">
                    Created: {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
