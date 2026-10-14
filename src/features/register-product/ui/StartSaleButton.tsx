import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/page-header'
import { useStartSale } from '../model/use-register-product'

export function StartSaleButton({ productId }: { productId: string }) {
  const start = useStartSale()
  return (
    <div className="flex items-center gap-2">
      <Button size="sm" disabled={start.isPending} onClick={() => start.mutate(productId)}>
        판매 시작
      </Button>
      {start.isError && <StateMessage tone="error">{getErrorMessage(start.error)}</StateMessage>}
    </div>
  )
}
