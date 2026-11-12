import { nullable, num, obj, pageOf, recordOf, str } from '@/shared/api'

export const stuckSummaryShape = recordOf(num)

export const stuckOrderPageShape = pageOf(
  obj({
    kind: str,
    orderId: nullable(str),
    targetType: str,
    targetId: nullable(str),
    status: str,
    since: str,
    outbox: nullable(
      obj({
        outboxId: str,
        eventType: str,
        eventId: str,
        attemptCount: num,
        createdAt: str,
        lastError: nullable(str),
        backlogCount: num,
        quarantinedAt: nullable(str),
      }),
    ),
    aiMemo: nullable(
      obj({
        summary: str,
        recommendedAction: str,
        confidence: str,
        provider: str,
        model: str,
        createdAt: str,
      }),
    ),
  }),
)
