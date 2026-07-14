import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getProjects, createProject } from '@/features/projects/server/projectApi'
import { useHasGlobalRole } from '@/modules/rbac'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useState } from 'react'
import { PageLayout } from '@/components/layout/page-layout'

export const Route = createFileRoute('/_authenticated/projects/')({
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData({
      queryKey: ['projects'],
      queryFn: () => getProjects(),
    })
  },
  component: ProjectsListPage,
})

function ProjectsListPage() {
  const router = useRouter()
  // Global check: only editors/admins can create new projects
  const canCreate = useHasGlobalRole('editor')
  const [isCreating, setIsCreating] = useState(false)

  const { data: projects } = useSuspenseQuery({
    queryKey: ['projects'],
    queryFn: () => getProjects(),
  })

  async function handleCreate() {
    setIsCreating(true)
    try {
      await createProject({ data: { name: 'New Project', description: 'Just created' } })
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
            className="px-4 py-2 bg-sea-ink text-white rounded-lg text-sm font-medium transition hover:opacity-90 disabled:opacity-50"
          >
            {isCreating ? 'Creating...' : 'Create Project'}
          </button>
        )
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.length === 0 ? (
          <div className="col-span-full p-8 text-center text-sea-ink-soft border border-dashed border-line rounded-xl">
            No projects found. You might not have access to any yet.
          </div>
        ) : (
          projects.map((project) => (
            <Link
              key={project.id}
              to="/projects/$projectId"
              params={{ projectId: project.id }}
              className="block group"
            >
              <Card className="island-shell border-none h-full transition-transform group-hover:-translate-y-1 group-hover:shadow-md">
                <CardHeader>
                  <CardTitle>{project.name}</CardTitle>
                  <CardDescription>{project.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-sea-ink-soft">
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
