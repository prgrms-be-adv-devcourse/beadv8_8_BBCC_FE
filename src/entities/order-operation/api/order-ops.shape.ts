import { arr, nullable, num, obj, pageOf, recordOf, str } from '@/shared/api'

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

export const paymentRecoveryShape = obj({
  recoveryId: str,
  orderId: str,
  paymentId: str,
  memberId: str,
  amount: num,
  items: arr(obj({ orderItemId: str, amount: num })),
  status: str,
  failureCode: nullable(str),
  attemptCount: num,
  lastAttemptedAt: nullable(str),
  createdAt: str,
})
export const paymentRecoveryPageShape = pageOf(paymentRecoveryShape)

export const eventFailureShape = obj({
  failureId: str,
  eventType: str,
  orderId: nullable(str),
  stockFailures: arr(obj({ orderItemId: str, reason: str })),
  status: str,
  failureCode: nullable(str),
  attemptCount: num,
  lastAttemptedAt: nullable(str),
  createdAt: str,
})
export const eventFailurePageShape = pageOf(eventFailureShape)

const quarantinedOutboxShape = obj({
  outboxId: str,
  eventId: str,
  eventType: str,
  topic: str,
  messageKey: nullable(str),
  status: str,
  attemptCount: num,
  lastError: nullable(str),
  createdAt: str,
  quarantinedAt: nullable(str),
  sentAt: nullable(str),
  lastRetriedAt: nullable(str),
  lastRetriedBy: nullable(str),
  retryCount: num,
})
export const quarantinedOutboxPageShape = pageOf(quarantinedOutboxShape)
export { quarantinedOutboxShape }
