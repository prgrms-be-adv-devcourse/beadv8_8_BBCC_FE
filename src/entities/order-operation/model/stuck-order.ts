import { labelOf } from '@/shared/lib'
import type { StuckOrderDto, StuckSummaryDto } from '../api/order-ops.dto'

/** BE StuckOrderKind 선언 순서 (요약 키 순서) */
export const STUCK_KINDS = [
  'STOCK_CHECK_STALE',
  'PAYMENT_EXPIRY_MISSED',
  'PAID_WITHOUT_DELIVERY',
  'RECOVERY_PENDING_STALE',
  'SHIPPING_DELAYED',
  'AUTO_CONFIRM_MISSED',
  'OUTBOX_STUCK',
] as const

const STUCK_KIND_LABEL: Record<string, string> = {
  STOCK_CHECK_STALE: '재고 확인이 멈춤',
  PAYMENT_EXPIRY_MISSED: '결제 마감 처리 안 됨',
  PAID_WITHOUT_DELIVERY: '결제 뒤 배송이 안 만들어짐',
  RECOVERY_PENDING_STALE: '결제 반영 실패가 오래 대기',
  SHIPPING_DELAYED: '발송 지연',
  AUTO_CONFIRM_MISSED: '자동 구매확정 안 됨',
  OUTBOX_STUCK: '이벤트 전송 멈춤',
}

const AI_CONFIDENCE_LABEL: Record<string, string> = {
  LOW: '확신 낮음',
  MEDIUM: '확신 보통',
  HIGH: '확신 높음',
}

export function stuckKindLabel(kind: string): string {
  return labelOf(STUCK_KIND_LABEL, kind)
}

export function aiConfidenceLabel(confidence: string): string {
  return labelOf(AI_CONFIDENCE_LABEL, confidence)
}

export type StuckSummaryItem = { kind: string; count: number }

/** 요약: BE 선언 순서대로, 없는 종류는 0. BE가 더한 종류는 뒤에 붙인다 */
export function toStuckSummary(dto: StuckSummaryDto): StuckSummaryItem[] {
  const known: string[] = [...STUCK_KINDS]
  const extra = Object.keys(dto).filter((kind) => !known.includes(kind))
  return [...known, ...extra].map((kind) => ({ kind, count: dto[kind] ?? 0 }))
}

/** 처음 열 종류: 건수가 있는 첫 종류, 모두 0이면 첫 종류 */
export function firstStuckKindWithCount(summary: StuckSummaryItem[]): string {
  return (summary.find((each) => each.count > 0) ?? summary[0]).kind
}

export type StuckOrder = {
  /** 줄 구분용 (종류 + 대상) */
  key: string
  kind: string
  orderId: string | null
  targetType: string
  targetId: string | null
  status: string
  since: string
  outbox: {
    eventType: string
    attemptCount: number
    lastError: string | null
    backlogCount: number
  } | null
  aiMemo: {
    summary: string
    recommendedAction: string
    confidence: string
    model: string
    createdAt: string
  } | null
}

export function toStuckOrder(dto: StuckOrderDto): StuckOrder {
  return {
    key: `${dto.kind}-${dto.targetType}-${dto.targetId ?? dto.orderId ?? dto.since}`,
    kind: dto.kind,
    orderId: dto.orderId,
    targetType: dto.targetType,
    targetId: dto.targetId,
    status: dto.status,
    since: dto.since,
    outbox: dto.outbox && {
      eventType: dto.outbox.eventType,
      attemptCount: dto.outbox.attemptCount,
      lastError: dto.outbox.lastError,
      backlogCount: dto.outbox.backlogCount,
    },
    aiMemo: dto.aiMemo && {
      summary: dto.aiMemo.summary,
      recommendedAction: dto.aiMemo.recommendedAction,
      confidence: dto.aiMemo.confidence,
      model: dto.aiMemo.model,
      createdAt: dto.aiMemo.createdAt,
    },
  }
}
