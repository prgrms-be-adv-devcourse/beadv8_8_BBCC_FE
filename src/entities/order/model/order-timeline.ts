import type { OrderTimelineDto } from '../api/order.dto'

export type TimelineStepStatus = 'DONE' | 'PARTIAL' | 'WAITING' | 'NOT_APPLICABLE'

export type TimelineDetail = {
  key: string
  /** 판매자 상호명 또는 상품명 */
  label: string
  status: TimelineStepStatus
  at: string | null
  /** 앞 단계 완료 시각부터 (ms). 시각이 없으면 null */
  gapMs: number | null
  /** 구매확정: 직접 · 자동 */
  confirmType: 'DIRECT' | 'AUTO' | null
}

export type TimelineStep = {
  step: string
  label: string
  status: TimelineStepStatus
  at: string | null
  /** 앞의 완료 단계 시각부터 (ms) */
  gapMs: number | null
  approximate: boolean
  /** 지금 단계 (currentStep) */
  current: boolean
  /** 취소 단계 */
  cancelled: boolean
  details: TimelineDetail[]
}

export type OrderTimeline = {
  orderId: string
  cancelReason: string | null
  paymentDueAt: string | null
  steps: TimelineStep[]
}

export const TIMELINE_STEP_LABEL: Record<string, string> = {
  CREATED: '주문 생성',
  PAYMENT_REQUESTED: '재고 확보 · 결제 요청',
  PAID: '결제 완료',
  CANCELLED: '주문 취소',
  SHIPPED: '발송',
  DELIVERED: '배송 완료',
  CONFIRMED: '구매확정',
}

export const TIMELINE_CANCEL_LABEL: Record<string, string> = {
  OUT_OF_STOCK: '재고 부족',
  PAYMENT_FAILED: '결제 실패',
  PAYMENT_EXPIRED: '결제 마감 지남',
  BUYER_CANCELLED: '구매자 취소',
}

const timeOf = (at: string) => new Date(at).getTime()

/** 서버 타임라인 → 화면 값. 간격은 서버가 주지 않아 앞의 완료 단계 시각으로 계산한다 (BE #352 결정 3) */
export function toOrderTimeline(dto: OrderTimelineDto): OrderTimeline {
  let previousAt: string | null = null
  const steps = dto.steps.map((step) => {
    const base = previousAt
    const gap = (at: string | null) => (at && base ? timeOf(at) - timeOf(base) : null)
    const result: TimelineStep = {
      step: step.step,
      label: TIMELINE_STEP_LABEL[step.step] ?? step.step,
      status: step.status as TimelineStepStatus,
      at: step.at,
      gapMs: gap(step.at),
      approximate: step.approximate,
      current: step.step === dto.currentStep,
      cancelled: step.step === 'CANCELLED',
      details: step.details.map((detail, index) => ({
        key: detail.sellerOrderId ?? detail.orderItemId ?? String(index),
        label: detail.sellerName ?? detail.productName ?? `#${detail.sellerId ?? index + 1}`,
        status: detail.status as TimelineStepStatus,
        at: detail.at,
        gapMs: gap(detail.at),
        confirmType: (detail.confirmType as 'DIRECT' | 'AUTO' | null | undefined) ?? null,
      })),
    }
    if (step.at) previousAt = step.at
    return result
  })
  return {
    orderId: dto.orderId,
    cancelReason: dto.cancelReason,
    paymentDueAt: dto.paymentDueAt,
    steps,
  }
}

/** 간격 글자: +1초 · +3분 · +2시간 5분 · +1일 3시간 */
export function formatGap(ms: number): string {
  const seconds = Math.max(0, Math.round(ms / 1000))
  if (seconds < 60) return `+${seconds}초`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `+${minutes}분`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `+${hours}시간${minutes % 60 ? ` ${minutes % 60}분` : ''}`
  const days = Math.floor(hours / 24)
  return `+${days}일${hours % 24 ? ` ${hours % 24}시간` : ''}`
}

/** 진행한 건수 (일부 완료 표시용) */
export function doneCount(step: TimelineStep): { done: number; total: number } {
  return {
    done: step.details.filter((detail) => detail.status === 'DONE').length,
    total: step.details.filter((detail) => detail.status !== 'NOT_APPLICABLE').length,
  }
}
