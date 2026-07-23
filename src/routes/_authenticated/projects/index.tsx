import { useState } from "react"
import { useSuspenseQuery } from "@tanstack/react-query"
import { Link, createFileRoute, useRouter } from "@tanstack/react-router"

import { useHasGlobalRole } from "@/modules/rbac"
import { createProject, getProjects } from "@/features/projects/server/projectApi"
import { PageLayout } from "@/components/layout/page-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const Route = createFileRoute("/_authenticated/projects/")({
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData({
      queryKey: ["projects"],
      queryFn: () => getProjects(),
    })
  },
  component: ProjectsListPage,
})

function ProjectsListPage() {
  const router = useRouter()
  // Global check: only editors/admins can create new projects
  const canCreate = useHasGlobalRole("editor")
  const [isCreating, setIsCreating] = useState(false)

  const { data: projects } = useSuspenseQuery({
    queryKey: ["projects"],
    queryFn: () => getProjects(),
  })

  async function handleCreate() {
    setIsCreating(true)
    try {
      await createProject({ data: { name: "New Project", description: "Just created" } })
      await router.invalidate()
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <PageLayout
      title="Projects"
      description="Projects you have access to."
      actions={
        canCreate && (
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="bg-sea-ink rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {isCreating ? "Creating..." : "Create Project"}
          </button>
        )
      }
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.length === 0 ? (
          <div className="text-sea-ink-soft border-line col-span-full rounded-xl border border-dashed p-8 text-center">
            No projects found. You might not have access to any yet.
          </div>
        ) : (
          projects.map((project) => (
            <Link
              key={project.id}
              to="/projects/$projectId"
              params={{ projectId: project.id }}
              className="group block"
            >
              <Card className="island-shell h-full border-none transition-transform group-hover:-translate-y-1 group-hover:shadow-md">
                <CardHeader>
                  <CardTitle>{project.name}</CardTitle>
                  <CardDescription>{project.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sea-ink-soft text-sm">
                    Created: {new Date(project.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </PageLayout>
  )
}
