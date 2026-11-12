import { labelOf } from '@/shared/lib'
import type {
  EventFailureDto,
  PaymentRecoveryDto,
  QuarantinedOutboxDto,
} from '../api/order-ops.dto'

const FAILURE_STATUS_LABEL: Record<string, string> = {
  PENDING: '처리 대기',
  RECOVERED: '복구됨',
  CANCELLED: '종료됨',
  NOT_RETRYABLE: '재처리 불가',
}

export function failureStatusLabel(status: string): string {
  return labelOf(FAILURE_STATUS_LABEL, status)
}

/** 재처리 · 종료는 처리 대기일 때만 (복구됨 · 종료됨 · 재처리 불가는 사람이 할 일이 없다) */
export function canRetryFailure(record: { status: string }): boolean {
  return record.status === 'PENDING'
}

export type PaymentRecovery = {
  id: string
  orderId: string
  amount: number
  status: string
  failureCode: string | null
  attemptCount: number
  lastAttemptedAt: string | null
  createdAt: string
}

export function toPaymentRecovery(dto: PaymentRecoveryDto): PaymentRecovery {
  return {
    id: dto.recoveryId,
    orderId: dto.orderId,
    amount: dto.amount,
    status: dto.status,
    failureCode: dto.failureCode,
    attemptCount: dto.attemptCount,
    lastAttemptedAt: dto.lastAttemptedAt,
    createdAt: dto.createdAt,
  }
}

export type EventFailure = {
  id: string
  eventType: string
  orderId: string | null
  stockFailureCount: number
  status: string
  failureCode: string | null
  attemptCount: number
  lastAttemptedAt: string | null
  createdAt: string
}

export function toEventFailure(dto: EventFailureDto): EventFailure {
  return {
    id: dto.failureId,
    eventType: dto.eventType,
    orderId: dto.orderId,
    stockFailureCount: dto.stockFailures.length,
    status: dto.status,
    failureCode: dto.failureCode,
    attemptCount: dto.attemptCount,
    lastAttemptedAt: dto.lastAttemptedAt,
    createdAt: dto.createdAt,
  }
}

export type QuarantinedOutbox = {
  id: string
  eventType: string
  /** 메시지 키가 주문 ID(0으로 시작하지 않는 숫자)일 때만 */
  orderId: string | null
  status: string
  attemptCount: number
  lastError: string | null
  quarantinedAt: string | null
  retryCount: number
}

export function toQuarantinedOutbox(dto: QuarantinedOutboxDto): QuarantinedOutbox {
  return {
    id: dto.outboxId,
    eventType: dto.eventType,
    orderId: dto.messageKey && /^[1-9]\d*$/.test(dto.messageKey) ? dto.messageKey : null,
    status: dto.status,
    attemptCount: dto.attemptCount,
    lastError: dto.lastError,
    quarantinedAt: dto.quarantinedAt,
    retryCount: dto.retryCount,
  }
}
