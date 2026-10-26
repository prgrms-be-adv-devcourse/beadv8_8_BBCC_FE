import { getErrorMessage } from '@/shared/api'
import { useSuspendMember } from '../model/use-suspend'
import { SuspendReasonForm } from './SuspendReasonForm'

type SuspendMemberFormProps = { memberId: string; onClose: () => void }

/** 이용 정지 사유 입력. 정지되면 닫는다 */
export function SuspendMemberForm({ memberId, onClose }: SuspendMemberFormProps) {
  const suspend = useSuspendMember(memberId)
  return (
    <SuspendReasonForm
      reasonLabel="정지 사유"
      submitLabel="정지하기"
      pending={suspend.isPending}
      error={suspend.isError ? getErrorMessage(suspend.error) : null}
      onSubmit={(reason) => suspend.mutate(reason, { onSuccess: onClose })}
      onCancel={onClose}
    />
  )
}
