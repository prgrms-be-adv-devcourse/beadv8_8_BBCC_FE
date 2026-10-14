import { getErrorMessage } from '@/shared/api'
import { ReasonForm } from '@/shared/ui/reason-form'
import { useSuspendMember, useSuspendSeller } from '../model/use-suspend'

export function SuspendMemberForm({ memberId }: { memberId: string }) {
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

export function SuspendSellerForm({ sellerId }: { sellerId: string }) {
  const suspend = useSuspendSeller(sellerId)
  return (
    <ReasonForm
      openLabel="판매자 자격 정지"
      reasonLabel="판매자 정지 사유"
      submitLabel="자격 정지하기"
      pending={suspend.isPending}
      error={suspend.isError ? getErrorMessage(suspend.error) : null}
      onSubmit={(reason) => suspend.mutate(reason)}
    />
  )
}
