import { getErrorMessage } from '@/shared/api'
import { ReasonForm } from '@/shared/ui/ReasonForm'
import { useSuspendSeller } from '../model/use-suspend'

type SuspendSellerFormProps = { sellerId: string }

export function SuspendSellerForm({ sellerId }: SuspendSellerFormProps) {
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
