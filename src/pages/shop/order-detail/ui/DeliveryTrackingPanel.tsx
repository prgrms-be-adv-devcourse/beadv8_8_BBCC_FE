import { useState } from 'react'
import {
  DeliveryTrackingTimeline,
  trackingErrorOf,
  useDeliveryTrackingQuery,
} from '@/entities/order'
import { Button } from '@/shared/ui/button'
import { ListSkeleton } from '@/shared/ui/Skeleton'

type DeliveryTrackingPanelProps = { orderId: string; deliveryId: string }

/** 「배송 조회」를 누르면 그 배송의 택배 진행 이력을 펼친다 (누르기 전에는 부르지 않는다) */
export function DeliveryTrackingPanel({ orderId, deliveryId }: DeliveryTrackingPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const tracking = useDeliveryTrackingQuery(orderId, deliveryId, { enabled: isOpen })
  const panelId = `delivery-tracking-${deliveryId}`
  const error = tracking.isError ? trackingErrorOf(tracking.error) : null

  return (
    <div className="border-rule border-b px-4 py-3">
      <Button
        variant="outline"
        size="sm"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? '배송 조회 닫기' : '배송 조회'}
      </Button>
      {isOpen && (
        <section id={panelId} aria-label="배송 조회" className="pt-3">
          {tracking.isPending ? (
            <ListSkeleton rows={2} />
          ) : error ? (
            <div role="alert" className="flex flex-wrap items-center gap-2 text-[13px]">
              <span className="text-destructive">{error.message}</span>
              {error.canRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={tracking.isFetching}
                  onClick={() => void tracking.refetch()}
                >
                  다시 시도
                </Button>
              )}
            </div>
          ) : (
            tracking.data && <DeliveryTrackingTimeline tracking={tracking.data} />
          )}
        </section>
      )}
    </div>
  )
}
