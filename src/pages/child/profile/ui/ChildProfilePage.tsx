import { ChildCard, useOwnChildProfileQuery } from '@/entities/child'
import { getErrorMessage, getErrorStatus } from '@/shared/api'
import { StateMessage } from '@/shared/ui/StateMessage'

export function ChildProfilePage() {
  const profile = useOwnChildProfileQuery()
  if (profile.isPending) return <StateMessage>불러오는 중…</StateMessage>
  if (profile.isError)
    return (
      <StateMessage tone="error">
        {getErrorStatus(profile.error) === 404
          ? '아직 보호자가 연결한 프로필이 없어요.'
          : getErrorMessage(profile.error)}
      </StateMessage>
    )
  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-section">내 프로필</h1>
      <ChildCard child={profile.data} />
    </div>
  )
}
