import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useAdminStopSale } from '../model/use-manage-product'

type AdminStopSaleFormProps = { productId: string }

/** 관리자 판매 중지 (BE는 사유를 받지 않는다). 중지하면 판매자가 다시 판매할 수 없다 */
export function AdminStopSaleForm({ productId }: AdminStopSaleFormProps) {
  const stop = useAdminStopSale(productId)
  return (
    <span className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={stop.isPending}
        onClick={() => {
          if (window.confirm('이 상품의 판매를 중지할까요? 판매자는 다시 판매할 수 없어요.'))
            stop.mutate()
        }}
      >
        판매 중지
      </Button>
      {stop.isError && <StateMessage tone="error">{getErrorMessage(stop.error)}</StateMessage>}
    </span>
  )
}
