import type { ShippingAddress } from '@/entities/address'
import type { CartLine } from '@/entities/cart'
import type { Order } from '@/entities/order'
import { getErrorMessage } from '@/shared/api'
import { formatWon } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/page-header'
import { usePlaceOrder } from '../model/use-place-order'

type Props = {
  lines: CartLine[]
  address: ShippingAddress | null
  totalAmount: number
  onPlaced: (order: Order) => void
}

export function PlaceOrderButton({ lines, address, totalAmount, onPlaced }: Props) {
  const place = usePlaceOrder({ onPlaced })

  return (
    <div className="space-y-2">
      <Button
        size="lg"
        className="w-full"
        disabled={lines.length === 0 || !address || place.isPending}
        onClick={() => {
          if (address && window.confirm(`${formatWon(totalAmount)}을 예치금으로 결제할까요?`)) {
            place.mutate({ lines, address })
          }
        }}
      >
        {formatWon(totalAmount)} 주문하기
      </Button>
      {place.isError && (
        <StateMessage tone="error">
          {getErrorMessage(place.error)}
          {place.needsRecheck && ' 장바구니를 다시 불러왔어요. 확인 후 다시 눌러 주세요.'}
        </StateMessage>
      )}
    </div>
  )
}
