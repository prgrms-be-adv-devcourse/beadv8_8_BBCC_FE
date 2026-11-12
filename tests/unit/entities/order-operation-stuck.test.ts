import { describe, expect, it } from 'vitest'
import {
  aiConfidenceLabel,
  firstStuckKindWithCount,
  stuckKindLabel,
  STUCK_KINDS,
  toStuckOrder,
  toStuckSummary,
} from '@/entities/order-operation'
import {
  stuckOrderPageShape,
  stuckSummaryShape,
} from '@/entities/order-operation/api/order-ops.shape'
import { validate } from '@/shared/api/contract'

// BE StuckOrderController (#445 · #926)
const summary = {
  STOCK_CHECK_STALE: 0,
  PAYMENT_EXPIRY_MISSED: 0,
  PAID_WITHOUT_DELIVERY: 0,
  RECOVERY_PENDING_STALE: 0,
  SHIPPING_DELAYED: 2,
  AUTO_CONFIRM_MISSED: 0,
  OUTBOX_STUCK: 1,
}
const row = {
  kind: 'SHIPPING_DELAYED',
  orderId: '16',
  targetType: 'DELIVERY',
  targetId: '11',
  status: 'READY',
  since: '2026-11-12T10:00:00',
  outbox: null,
  aiMemo: {
    summary: '판매자가 송장을 넣지 않았어요',
    recommendedAction: '판매자에게 발송을 요청하세요',
    confidence: 'MEDIUM',
    provider: 'api.groq.com',
    model: 'llama',
    createdAt: '2026-11-12T10:05:00',
  },
}

describe('관리자 멈춘 주문 (BE #445 · AI 메모 #926)', () => {
  it('요약 · 목록 계약', () => {
    expect(validate(summary, stuckSummaryShape)).toEqual([])
    const page = {
      content: [row],
      page: 0,
      size: 20,
      totalElements: 1,
      totalPages: 1,
      hasNext: false,
    }
    expect(validate(page, stuckOrderPageShape)).toEqual([])
  })
  it('요약은 BE 선언 순서대로, 없는 종류는 0', () => {
    expect(toStuckSummary({ SHIPPING_DELAYED: 2 }).map((each) => [each.kind, each.count])).toEqual(
      STUCK_KINDS.map((kind) => [kind, kind === 'SHIPPING_DELAYED' ? 2 : 0]),
    )
  })
  it('처음 열 종류: 건수가 있는 첫 종류, 모두 0이면 첫 종류', () => {
    expect(firstStuckKindWithCount(toStuckSummary(summary))).toBe('SHIPPING_DELAYED')
    expect(firstStuckKindWithCount(toStuckSummary({}))).toBe('STOCK_CHECK_STALE')
  })
  it('목록 한 줄 · AI 메모', () => {
    expect(toStuckOrder(row)).toMatchObject({
      kind: 'SHIPPING_DELAYED',
      orderId: '16',
      since: '2026-11-12T10:00:00',
      aiMemo: { summary: '판매자가 송장을 넣지 않았어요', confidence: 'MEDIUM' },
    })
    expect(toStuckOrder({ ...row, aiMemo: null }).aiMemo).toBeNull()
  })
  it('라벨: 모르는 종류 · 확신도는 코드 그대로', () => {
    expect(stuckKindLabel('SHIPPING_DELAYED')).toBe('발송 지연')
    expect(stuckKindLabel('NEW_KIND')).toBe('NEW_KIND')
    expect(aiConfidenceLabel('HIGH')).toBe('확신 높음')
    expect(aiConfidenceLabel('UNKNOWN')).toBe('UNKNOWN')
  })
})
