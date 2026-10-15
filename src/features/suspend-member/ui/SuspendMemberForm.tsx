import { getErrorMessage } from '@/shared/api'
import { ReasonForm } from '@/shared/ui/ReasonForm'
import { useSuspendMember } from '../model/use-suspend'

type SuspendMemberFormProps = { memberId: string }

export function SuspendMemberForm({ memberId }: SuspendMemberFormProps) {
  const suspend = useSuspendMember(memberId)
  return (
    <ReasonForm
      openLabel="이용 정지"
      reasonLabel="정지 사유"
      submitLabel="정지하기"
      pending={suspend.isPending}
      error={suspend.isError ? getErrorMessage(suspend.error) : null}
      onSubmit={(reason) => suspend.mutate(reason)}
    />
  )
}
