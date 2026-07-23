import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

import { PageLayout } from "@/components/layout/page-layout"

import { EmailCard } from "@/features/account/components/EmailCard"
import { PasswordCard } from "@/features/account/components/PasswordCard"
import { ProfileCard } from "@/features/account/components/ProfileCard"
import { SessionsCard } from "@/features/account/components/SessionsCard"
import { listUserAccounts } from "@/features/auth/server/authApi"

export const Route = createFileRoute("/_authenticated/account/")({
  loader: async ({ context: { queryClient } }) => {
    // Only fetch accounts to check credential vs oauth
    const accounts = await queryClient.ensureQueryData({
      queryKey: ["userAccounts"],
      queryFn: () => listUserAccounts(),
    })
    return { accounts }
  },
  component: AccountPage,
})

function AccountPage() {
  const { data: accounts } = useSuspenseQuery({
    queryKey: ["userAccounts"],
    queryFn: () => listUserAccounts(),
  })

  const hasCredentialAccount = accounts?.some((a) => a.providerId === "credential") ?? false

  return (
    <PageLayout title="Account" description="Manage your account settings" className="max-w-2xl">
      <div className="space-y-6">
        <ProfileCard />
        <EmailCard />
        <PasswordCard hasCredentialAccount={hasCredentialAccount} />
        <SessionsCard />
      </div>
    </PageLayout>
  )
}
