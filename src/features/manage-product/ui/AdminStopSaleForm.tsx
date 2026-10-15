import { getErrorMessage } from '@/shared/api'
import { ReasonForm } from '@/shared/ui/ReasonForm'
import { useAdminStopSale } from '../model/use-manage-product'
import { MockBadge } from '@/shared/ui/MockBadge'

type AdminStopSaleFormProps = { productId: string }

export function AdminStopSaleForm({ productId }: AdminStopSaleFormProps) {
  const stop = useAdminStopSale(productId)
  return (
    <span className="inline-flex items-start">
      <ReasonForm
        openLabel="판매 중지"
        reasonLabel="판매 중지 사유"
        submitLabel="중지하기"
        pending={stop.isPending}
        error={stop.isError ? getErrorMessage(stop.error) : null}
        onSubmit={(reason) => stop.mutate(reason)}
      />
      <MockBadge endpoints={['POST /admin/products/:productId/stop-sale']} className="mt-2" />
    </span>
  )
}
