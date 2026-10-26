import { useState } from 'react'
import { validateTrackingNumber, type SellerOrder } from '@/entities/seller-order'
import { getErrorMessage } from '@/shared/api'
import { CARRIERS } from '@/shared/config'
import { confirmAction } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { Input, Select } from '@/shared/ui/input'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useBulkShipping } from '../model/use-ship-order'

type BulkShippingBarProps = {
  toShip: SellerOrder[]
  toDeliver: SellerOrder[]
  onDone: () => void
}

/** 고른 주문 일괄 처리: 발송(택배사 하나 · 주문별 송장) / 배송 완료 */
export function BulkShippingBar({ toShip, toDeliver, onDone }: BulkShippingBarProps) {
  const { shipMany, deliverMany } = useBulkShipping()
  const [carrier, setCarrier] = useState('CJ')
  const [tracking, setTracking] = useState<Record<string, string>>({})
  const numberOf = (order: SellerOrder) => tracking[order.id] ?? ''
  const missing = toShip.filter((order) => validateTrackingNumber(numberOf(order)) !== null)
  const pending = shipMany.isPending || deliverMany.isPending
  const error = shipMany.error ?? deliverMany.error

  return (
    <section
      aria-label="일괄 처리"
      className="bg-paper-2 sticky top-2 z-10 space-y-3 rounded-lg p-4 md:top-20"
    >
      {toShip.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">
              발송할 주문 <span className="figure">{toShip.length}</span>건
            </span>
            <Select
              aria-label="일괄 발송 택배사"
              className="bg-paper h-9 w-36 rounded-md max-sm:h-11"
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
            >
              {CARRIERS.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.name}
                </option>
              ))}
            </Select>
            <Button
              className="ml-auto h-9 rounded-md px-4 max-sm:h-11"
              disabled={pending || missing.length > 0}
              onClick={async () => {
                if (
                  await confirmAction({
                    title: `${toShip.length}건을 발송 처리할까요?`,
                    description: '구매자 주문에 배송 중으로 보여요.',
                    confirmLabel: '일괄 발송',
                  })
                )
                  shipMany.mutate(
                    toShip.map((order) => ({
                      sellerOrderId: order.id,
                      carrier,
                      trackingNumber: numberOf(order),
                    })),
                    { onSuccess: onDone },
                  )
              }}
            >
              {toShip.length}건 일괄 발송
            </Button>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {toShip.map((order) => (
              <li key={order.id} className="flex items-center gap-2 text-sm">
                <span className="figure w-24 shrink-0">판매 주문 #{order.id}</span>
                <Input
                  aria-label={`판매 주문 #${order.id} 송장 번호`}
                  placeholder="송장 번호"
                  className="bg-paper figure h-9 rounded-md max-sm:h-11"
                  value={numberOf(order)}
                  onChange={(e) => setTracking({ ...tracking, [order.id]: e.target.value })}
                />
              </li>
            ))}
          </ul>
          {missing.length > 0 && (
            <p className="text-ink-3 text-[13px]">
              송장 번호를 모두 넣으면 발송할 수 있어요 (남은 {missing.length}건).
            </p>
          )}
        </div>
      )}
      {toDeliver.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">
            배송 중 <span className="figure">{toDeliver.length}</span>건
          </span>
          <Button
            variant="outline"
            className="border-field-edge bg-paper ml-auto h-9 rounded-md px-4 max-sm:h-11"
            disabled={pending}
            onClick={async () => {
              if (
                await confirmAction({
                  title: `${toDeliver.length}건을 배송 완료로 바꿀까요?`,
                  description: '구매자가 구매확정할 수 있게 돼요.',
                  confirmLabel: '배송 완료',
                })
              )
                deliverMany.mutate(
                  toDeliver.map((order) => order.id),
                  { onSuccess: onDone },
                )
            }}
          >
            {toDeliver.length}건 일괄 배송 완료
          </Button>
        </div>
      )}
      {error && <StateMessage tone="error">{getErrorMessage(error)}</StateMessage>}
    </section>
  )
}
