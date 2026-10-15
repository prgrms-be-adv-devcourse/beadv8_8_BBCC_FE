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
        <div className="flex items-center gap-2">
          <Select className="w-36" value={carrier} onChange={(e) => setCarrier(e.target.value)}>
            {CARRIERS.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name}
              </option>
            ))}
          </Select>
          <Input
            className="w-40"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
          />
          <Button
            size="sm"
            disabled={pending || invalid !== null}
            onClick={() => ship({ carrier, trackingNumber })}
          >
            발송
          </Button>
        </div>
      )}
      {step === 'DELIVER' && (
        <Button size="sm" disabled={pending} onClick={deliver}>
          배송 완료 처리
        </Button>
      )}
      {error && <StateMessage tone="error">{getErrorMessage(error)}</StateMessage>}
    </div>
  )
}
