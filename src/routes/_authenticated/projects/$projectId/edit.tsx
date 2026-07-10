import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getProject, updateProject } from '@/features/projects/server/projectApi'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

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

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
})

type ProjectValues = z.infer<typeof projectSchema>

function ProjectEditPage() {
  const { projectId } = Route.useParams()
  const router = useRouter()

  const { data: project } = useSuspenseQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject({ data: { id: projectId } }),
  })

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<ProjectValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: project.name,
      description: project.description ?? '',
    },
  })

  async function onSubmit(values: ProjectValues) {
    setIsSaving(true)
    setError(null)
    try {
      await updateProject({
        data: {
          id: projectId,
          name: values.name,
          description: values.description || undefined,
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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="px-4 py-3 text-sm rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
                  {error}
                </div>
              )}

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        id="name"
                        placeholder="Project Name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        id="desc"
                        rows={4}
                        placeholder="Optional description"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={isSaving}
                className="w-full"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
