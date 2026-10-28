import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { getErrorMessage } from '@/shared/api/api-error'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'
import { profileQueryOptions } from '@/features/account/api/account-queries'
import { ProfileForm } from '@/features/account/components/profile-form'

export const Route = createFileRoute('/perfil/')({
  component: ProfilePage,
})

function ProfileSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando perfil" className="flex flex-1 flex-col gap-8">
      <Skeleton className="h-4 w-52" />
      <div className="grid gap-6 md:grid-cols-2 md:gap-x-7">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-[4.9375rem] w-full" />
        ))}
      </div>
      <Skeleton className="h-10 w-[8.1875rem]" />
    </div>
  )
}

function ProfilePage() {
  const { session } = Route.useRouteContext()
  const query = useQuery(profileQueryOptions(session.user.id))

  if (query.isPending) {
    return <ProfileSkeleton />
  }

  if (query.isError) {
    return (
      <div role="alert" className="flex flex-1 flex-col items-start gap-4">
        <p className="text-sm text-text-secondary">{getErrorMessage(query.error)}</p>
        <Button onClick={() => void query.refetch()}>Tentar novamente</Button>
      </div>
    )
  }

  return <ProfileForm key={query.data.id} user={query.data} />
}
