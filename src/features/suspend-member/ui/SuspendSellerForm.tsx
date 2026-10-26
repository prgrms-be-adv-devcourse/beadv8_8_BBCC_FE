import { getErrorMessage } from '@/shared/api'
import { useSuspendSeller } from '../model/use-suspend'
import { SuspendReasonForm } from './SuspendReasonForm'

type SuspendSellerFormProps = { sellerId: string; onClose: () => void }

/** 판매자 자격 정지 사유 입력. 정지되면 닫는다 */
export function SuspendSellerForm({ sellerId, onClose }: SuspendSellerFormProps) {
  const suspend = useSuspendSeller(sellerId)
  return (
    <SuspendReasonForm
      reasonLabel="판매자 정지 사유"
      submitLabel="자격 정지하기"
      pending={suspend.isPending}
      error={suspend.isError ? getErrorMessage(suspend.error) : null}
      onSubmit={(reason) => suspend.mutate(reason, { onSuccess: onClose })}
      onCancel={onClose}
    />
  )
}
