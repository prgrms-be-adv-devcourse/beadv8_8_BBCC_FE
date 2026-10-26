import {
  doneCount,
  formatGap,
  TIMELINE_CANCEL_LABEL,
  useOrderTimelineQuery,
  type Order,
  type TimelineStep,
  type TimelineStepStatus,
} from '@/entities/order'
import { getErrorMessage } from '@/shared/api'
import { cn } from '@/shared/lib'
import { Card, CardTitle } from '@/shared/ui/card'
import { MockBadge } from '@/shared/ui/MockBadge'
import { StateMessage } from '@/shared/ui/StateMessage'
import { timelineRevision } from '../model/revision'

/** 10-16 12:00:01 (간격이 초 단위라 초까지) */
const timeLabel = (at: string) => at.replace('T', ' ').slice(5, 19)

const STATUS_TEXT: Record<TimelineStepStatus, string> = {
  DONE: '완료',
  PARTIAL: '일부 완료',
  WAITING: '대기',
  NOT_APPLICABLE: '해당 없음',
}

/** 단계 점: 완료는 채운 자두, 일부는 자두 테두리, 대기는 회색 테두리, 해당 없음은 옅은 회색, 취소는 빨강 */
function dotOf(step: TimelineStep) {
  if (step.cancelled) return 'bg-destructive'
  switch (step.status) {
    case 'DONE':
      return 'bg-primary'
    case 'PARTIAL':
      return 'border-primary bg-card border-2'
    case 'WAITING':
      return 'border-muted-foreground/40 bg-card border'
    default:
      return 'bg-muted'
  }
}

type OrderTimelineCardProps = { order: Order }

/** 주문 처리 과정: 서버 기록(BE #352)으로 단계 · 시각 · 앞 단계와의 간격 */
export function OrderTimelineCard({ order }: OrderTimelineCardProps) {
  const timeline = useOrderTimelineQuery(order.id, timelineRevision(order))

  return (
    <Card className="space-y-3">
      <CardTitle>
        처리 과정
        <MockBadge endpoints={['GET /orders/:orderId/timeline']} />
      </CardTitle>
      {timeline.isPending && <StateMessage>불러오는 중…</StateMessage>}
      {timeline.isError && (
        <StateMessage tone="error">{getErrorMessage(timeline.error)}</StateMessage>
      )}
      {timeline.data && (
        <ol aria-label="처리 과정" className="space-y-0">
          {timeline.data.steps.map((step, index) => {
            const last = index === timeline.data.steps.length - 1
            const skipped = step.status === 'NOT_APPLICABLE'
            const progress = doneCount(step)
            return (
              <li
                key={`${step.step}-${index}`}
                aria-label={
                  step.cancelled ? step.label : `${step.label} ${STATUS_TEXT[step.status]}`
                }
                className={cn('relative flex gap-3.5 pb-5 last:pb-0', skipped && 'opacity-50')}
              >
                {!last && (
                  <span
                    className="bg-border absolute top-4 bottom-0 left-[4.5px] w-px"
                    aria-hidden
                  />
                )}
                <span
                  aria-hidden
                  className={cn('z-10 mt-1.5 size-2.5 shrink-0 rounded-full', dotOf(step))}
                />
                <div className="min-w-0 flex-1 space-y-1 text-sm">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span
                      className={cn(
                        'font-medium',
                        step.current && 'text-primary font-semibold',
                        step.cancelled && 'text-destructive',
                      )}
                    >
                      {step.label}
                      {step.cancelled &&
                        timeline.data.cancelReason &&
                        ` · ${TIMELINE_CANCEL_LABEL[timeline.data.cancelReason] ?? timeline.data.cancelReason}`}
                    </span>
                    {step.at ? (
                      <span className="text-muted-foreground tabular-nums">
                        {step.approximate && '약 '}
                        {timeLabel(step.at)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        {step.status === 'PARTIAL'
                          ? `일부 완료 (${progress.done}/${progress.total})`
                          : STATUS_TEXT[step.status]}
                      </span>
                    )}
                    {step.gapMs !== null && (
                      <span className="text-muted-foreground ml-auto text-xs tabular-nums">
                        {formatGap(step.gapMs)}
                      </span>
                    )}
                  </div>
                  {step.approximate && (
                    <p className="text-muted-foreground text-xs">
                      시각은 주문이 마지막으로 바뀐 시각이에요.
                    </p>
                  )}
                  {step.step === 'PAYMENT_REQUESTED' &&
                    step.status !== 'DONE' &&
                    timeline.data.paymentDueAt && (
                      <p className="text-muted-foreground text-xs">
                        결제 마감 {timeLabel(timeline.data.paymentDueAt)}
                      </p>
                    )}
                  {step.details.length > 0 && !skipped && (
                    <ul className="space-y-0.5">
                      {step.details.map((detail) => (
                        <li
                          key={detail.key}
                          className="text-muted-foreground flex flex-wrap items-baseline gap-x-2 text-xs"
                        >
                          <span className="text-foreground">{detail.label}</span>
                          {detail.confirmType && (
                            <span className="rounded border px-1">
                              {detail.confirmType === 'AUTO' ? '자동' : '직접'}
                            </span>
                          )}
                          <span className="tabular-nums">
                            {detail.at ? timeLabel(detail.at) : STATUS_TEXT[detail.status]}
                          </span>
                          {detail.gapMs !== null && (
                            <span className="ml-auto tabular-nums">{formatGap(detail.gapMs)}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </Card>
  )
}
