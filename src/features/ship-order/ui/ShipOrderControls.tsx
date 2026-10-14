import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { CARRIERS } from '@/entities/order'
import { sellerOrderKeys, type SellerOrder } from '@/entities/seller-order'
import { apiClient, getErrorMessage, runWithAction } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { Input, Select } from '@/shared/ui/input'
import { StateMessage } from '@/shared/ui/page-header'

/** 발송(송장 등록) → 배송 완료. 판매자 몫의 배송 1건 단위 */
export function ShipOrderControls({ sellerOrder }: { sellerOrder: SellerOrder }) {
  const queryClient = useQueryClient()
  const [carrier, setCarrier] = useState('CJ')
  const [trackingNumber, setTrackingNumber] = useState('123456789012')
  const onSuccess = () => queryClient.invalidateQueries({ queryKey: sellerOrderKeys.list })

  const ship = useMutation({
    mutationFn: () =>
      runWithAction('발송 (송장 등록)', () =>
        apiClient.post(`/seller/orders/${sellerOrder.sellerOrderId}/ship`, {
          carrier,
          trackingNumber,
        }),
      ),
    onSuccess,
  })
  const deliver = useMutation({
    mutationFn: () =>
      runWithAction('배송 완료', () =>
        apiClient.post(`/seller/orders/${sellerOrder.sellerOrderId}/deliver`),
      ),
    onSuccess,
  })
  const error = ship.error ?? deliver.error

  return (
    <div className="space-y-2">
      {sellerOrder.status === 'READY' && (
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
            disabled={ship.isPending || !trackingNumber.trim()}
            onClick={() => ship.mutate()}
          >
            발송
          </Button>
        </div>
      )}
      {sellerOrder.status === 'SHIPPING' && (
        <Button size="sm" disabled={deliver.isPending} onClick={() => deliver.mutate()}>
          배송 완료 처리
        </Button>
      )}
      {error && <StateMessage tone="error">{getErrorMessage(error)}</StateMessage>}
    </div>
  )
}
