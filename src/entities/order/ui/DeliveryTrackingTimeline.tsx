import { carrierName } from '@/shared/config'
import type { DeliveryTracking } from '../model/delivery-tracking'
import { trackingStatusLabel } from '../model/delivery-tracking.rules'

type DeliveryTrackingTimelineProps = { tracking: DeliveryTracking }

/** 택배 진행 이력: 택배사 · 운송장 번호, 아래로 시각 · 장소 · 상태 (최신이 위) */
export function DeliveryTrackingTimeline({ tracking }: DeliveryTrackingTimelineProps) {
  return (
    <div className="space-y-3">
      {tracking.trackingNumber && (
        <p className="text-[13px]">
          <span className="font-semibold">{carrierName(tracking.carrier)}</span>{' '}
          <span className="text-ink-3 figure">{tracking.trackingNumber}</span>
        </p>
      )}
      {tracking.events.length === 0 ? (
        <p className="text-ink-3 text-[13px]">아직 조회할 이력이 없어요.</p>
      ) : (
        <ol aria-label="배송 이력" className="space-y-0">
          {tracking.events.map((event, index) => (
            <li
              key={`${event.time}-${index}`}
              className="border-rule relative grid grid-cols-[7.5rem_minmax(0,1fr)] gap-x-3 border-l py-2 pl-4 text-[13px]"
            >
              <span
                aria-hidden
                className={
                  index === 0
                    ? 'bg-signal absolute top-3.5 -left-[5px] size-2.5 rounded-full'
                    : 'bg-rule absolute top-3.5 -left-[4px] size-2 rounded-full'
                }
              />
              <span className="text-ink-3 figure">{event.time}</span>
              <span className="min-w-0">
                <span className={index === 0 ? 'font-semibold' : ''}>
                  {trackingStatusLabel(event.status)}
                </span>
                {event.location && <span className="text-ink-3"> · {event.location}</span>}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
