import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getProject, deleteProject } from '@/features/projects/server/projectApi'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useState } from 'react'
import { useRbac } from '@/modules/rbac'

export const Route = createFileRoute('/_authenticated/projects/$projectId/')({
  loader: async ({ params: { projectId }, context: { queryClient } }) => {
    // This inherently checks 'read' access on the server
    await queryClient.ensureQueryData({
      queryKey: ['project', projectId],
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
    queryKey: ['project', projectId],
    queryFn: () => getProject({ data: { id: projectId } }),
  })

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this project?')) return
    setIsDeleting(true)
    try {
      await deleteProject({ data: { id: projectId } })
      await router.invalidate()
      router.navigate({ to: '/projects' })
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed')
      setIsDeleting(false)
    }
  }

  return (
    <div className="p-8 space-y-6 rise-in max-w-3xl mx-auto">
      <Link to="/projects" className="text-sm font-medium text-sea-ink hover:underline">
        &larr; Back to projects
      </Link>

      <Card className="island-shell border-none">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl">{project.name}</CardTitle>
              <CardDescription>ID: {project.id}</CardDescription>
            </div>
            
            <div className="flex gap-2">
              {/* Note: In a real app you might want to fetch explicit per-resource grants 
                  for the UI check here, but the server will strictly enforce it when they click edit anyway. */}
              <Link
                to="/projects/$projectId/edit"
                params={{ projectId }}
                className="px-4 py-2 bg-sea-ink/10 text-sea-ink hover:bg-sea-ink/20 rounded-lg text-sm font-medium transition"
              >
                Edit
              </Link>
              
              {isAdmin && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-lg text-sm font-medium transition disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm text-sea-ink-soft">
            {project.description ? (
              <p>{project.description}</p>
            ) : (
              <p className="italic text-sea-ink-soft/60">No description provided.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
