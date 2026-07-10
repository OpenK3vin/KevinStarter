import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getProject, updateProject } from '@/features/projects/server/projectApi'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useState } from 'react'

export const Route = createFileRoute('/_authenticated/projects/$projectId/edit')({
  loader: async ({ params: { projectId }, context: { queryClient } }) => {
    // If they can't even read it, they definitely can't edit it
    await queryClient.ensureQueryData({
      queryKey: ['project', projectId],
      queryFn: () => getProject({ data: { id: projectId } }),
    })
  },
  component: ProjectEditPage,
})

function ProjectEditPage() {
  const { projectId } = Route.useParams()
  const router = useRouter()

  const { data: project } = useSuspenseQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject({ data: { id: projectId } }),
  })

  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    setError(null)
    try {
      await updateProject({
        data: {
          id: projectId,
          name,
          description: description || undefined,
        },
      })
      await router.invalidate()
      router.navigate({ to: '/projects/$projectId', params: { projectId } })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed. You might not have the "editor" role for this project.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="p-8 space-y-6 rise-in max-w-2xl mx-auto">
      <Link to="/projects/$projectId" params={{ projectId }} className="text-sm font-medium text-sea-ink hover:underline">
        &larr; Back to project
      </Link>

      <Card className="island-shell border-none">
        <CardHeader>
          <CardTitle>Edit Project</CardTitle>
          <CardDescription>Update the project details below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            {error && (
              <div className="px-4 py-3 text-sm rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="name" className="text-sm font-medium text-sea-ink">
                Name
              </label>
              <input
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-line bg-background focus:outline-none focus:ring-2 focus:ring-sea-ink/30 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="desc" className="text-sm font-medium text-sea-ink">
                Description
              </label>
              <textarea
                id="desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 text-sm rounded-lg border border-line bg-background focus:outline-none focus:ring-2 focus:ring-sea-ink/30 transition"
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-2.5 px-4 rounded-lg bg-sea-ink text-white text-sm font-medium transition hover:opacity-90 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
