import { confirmAction } from '@/shared/lib'
import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useStopSale } from '../model/use-manage-product'

type StopSaleButtonProps = { productId: string }

export function StopSaleButton({ productId }: StopSaleButtonProps) {
  const stop = useStopSale(productId)
  return (
    <span className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={stop.isPending}
        onClick={async () => {
          if (
            await confirmAction({
              title: '판매를 중지할까요?',
              description:
                '목록 · 추천에서 빠지고 장바구니에서 살 수 없어요. 다시 판매할 수 있어요.',
              confirmLabel: '판매 중지',
            })
          )
            stop.mutate()
        }}
      >
        판매 중지
      </Button>
      {stop.isError && <StateMessage tone="error">{getErrorMessage(stop.error)}</StateMessage>}
    </span>
  )
}
