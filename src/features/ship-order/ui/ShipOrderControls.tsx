import { useState } from 'react'
import { nextShippingStep, validateTrackingNumber, type SellerOrder } from '@/entities/seller-order'
import { getErrorMessage } from '@/shared/api'
import { CARRIERS } from '@/shared/config'
import { Button } from '@/shared/ui/button'
import { Input, Select } from '@/shared/ui/input'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useShipOrder } from '../model/use-ship-order'

type ShipOrderControlsProps = { sellerOrder: SellerOrder }

/** 발송(송장 등록) → 배송 완료. 판매자 몫의 배송 1건 단위 */
export function ShipOrderControls({ sellerOrder }: ShipOrderControlsProps) {
  const { ship, deliver, pending, error } = useShipOrder(sellerOrder.id)
  const [carrier, setCarrier] = useState('CJ')
  const [trackingNumber, setTrackingNumber] = useState('123456789012')
  const step = nextShippingStep(sellerOrder)
  const invalid = validateTrackingNumber(trackingNumber)

  return (
    <div className="space-y-2">
      {step === 'SHIP' && (
        <div className="flex flex-wrap items-end gap-2">
          <label className="space-y-1">
            <span className="text-ink-3 block text-[13px]">택배사</span>
            <Select
              className="bg-paper h-10 w-36 rounded-md max-sm:h-11"
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
            >
              {CARRIERS.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="min-w-40 flex-1 space-y-1 sm:max-w-56">
            <span className="text-ink-3 block text-[13px]">송장 번호</span>
            <Input
              className="bg-paper figure h-10 rounded-md max-sm:h-11"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
            />
          </label>
          <Button
            className="h-10 rounded-md px-5 max-sm:h-11"
            disabled={pending || invalid !== null}
            onClick={() => ship({ carrier, trackingNumber })}
          >
            발송
          </Button>
        </div>
      )}
      {step === 'DELIVER' && (
        <Button className="h-10 rounded-md px-5 max-sm:h-11" disabled={pending} onClick={deliver}>
          배송 완료 처리
        </Button>
      )}
      {error && <StateMessage tone="error">{getErrorMessage(error)}</StateMessage>}
    </div>
  )
}
