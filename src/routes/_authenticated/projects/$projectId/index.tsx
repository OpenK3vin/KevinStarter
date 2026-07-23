import { useState } from "react"

import { useSuspenseQuery } from "@tanstack/react-query"
import { Link, createFileRoute, useRouter } from "@tanstack/react-router"

import { PageLayout } from "@/components/layout/page-layout"
import { Card, CardContent } from "@/components/ui/card"

import { deleteProject, getProject } from "@/features/projects/server/projectApi"
import { useRbac } from "@/modules/rbac"

export const Route = createFileRoute("/_authenticated/projects/$projectId/")({
  loader: async ({ params: { projectId }, context: { queryClient } }) => {
    // This inherently checks 'read' access on the server
    await queryClient.ensureQueryData({
      queryKey: ["project", projectId],
      queryFn: () => getProject({ data: { id: projectId } }),
    })
  },
  component: ProjectViewPage,
})

function ProjectViewPage() {
  const { projectId } = Route.useParams()
  const router = useRouter()
  const { isAdmin } = useRbac()
  const [isDeleting, setIsDeleting] = useState(false)

  const { data: project } = useSuspenseQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProject({ data: { id: projectId } }),
  })

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this project?")) return
    setIsDeleting(true)
    try {
      await deleteProject({ data: { id: projectId } })
      await router.invalidate()
      router.navigate({ to: "/projects" })
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed")
      setIsDeleting(false)
    }
  }

  return (
    <PageLayout
      className="max-w-3xl"
      backLink={
        <Link to="/projects" className="text-sea-ink text-sm font-medium hover:underline">
          &larr; Back to projects
        </Link>
      }
      title={project.name}
      description={`ID: ${project.id}`}
      actions={
        <>
          {/* Note: In a real app you might want to fetch explicit per-resource grants 
              for the UI check here, but the server will strictly enforce it when they click edit anyway. */}
          <Link
            to="/projects/$projectId/edit"
            params={{ projectId }}
            className="bg-sea-ink/10 text-sea-ink hover:bg-sea-ink/20 rounded-lg px-4 py-2 text-sm font-medium transition"
          >
            Edit
          </Link>

          {isAdmin && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-lg bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive transition hover:bg-destructive/20 disabled:opacity-50"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          )}
        </>
      }
    >
      <Card className="island-shell border-none">
        <CardContent className="pt-6">
          <div className="text-sea-ink-soft prose prose-sm">
            {project.description ? (
              <p>{project.description}</p>
            ) : (
              <p className="text-sea-ink-soft/60 italic">No description provided.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </PageLayout>
  )
}
