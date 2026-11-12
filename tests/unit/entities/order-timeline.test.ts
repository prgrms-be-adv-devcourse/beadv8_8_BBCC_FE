import { describe, expect, it } from 'vitest'
import { formatGap, toOrderTimeline, type OrderTimelineDto } from '@/entities/order'

// GET /orders/{orderId}/timeline 응답 (BE #352): 결제 완료 12:00:02 뒤 판매자 둘 중 하나만 발송
const step = (
  name: string,
  status: string,
  at: string | null,
  details: OrderTimelineDto['steps'][number]['details'] = [],
  approximate = false,
) => ({ step: name, status, at, approximate, details })
const partlyShipped: OrderTimelineDto = {
  orderId: '12',
  status: 'PAID',
  currentStep: 'SHIPPED',
  cancelReason: null,
  paymentDueAt: null,
  steps: [
    step('CREATED', 'DONE', '2026-10-16T12:00:00'),
    step('PAYMENT_REQUESTED', 'DONE', '2026-10-16T12:00:01'),
    step('PAID', 'DONE', '2026-10-16T12:00:02'),
    step('SHIPPED', 'PARTIAL', null, [
      {
        sellerOrderId: '31',
        sellerId: '5',
        sellerName: '키들리상점',
        status: 'DONE',
        at: '2026-10-16T14:00:00',
      },
      { sellerOrderId: '32', sellerId: '8', sellerName: '꼬마옷장', status: 'WAITING', at: null },
    ]),
    step('DELIVERED', 'WAITING', null),
    step('CONFIRMED', 'WAITING', null),
  ],
}

describe('formatGap: 앞 단계와의 간격', () => {
  it('초 · 분 · 시간 · 일', () => {
    expect(formatGap(1000)).toBe('+1초')
    expect(formatGap(59_000)).toBe('+59초')
    expect(formatGap(60_000)).toBe('+1분')
    expect(formatGap(2 * 3600_000)).toBe('+2시간')
    expect(formatGap(2 * 3600_000 + 5 * 60_000)).toBe('+2시간 5분')
    expect(formatGap(27 * 3600_000)).toBe('+1일 3시간')
  })
})

describe('주문 처리 타임라인 (BE #352 계약)', () => {
  it('일부 발송: 발송은 판매자별 details, 간격은 앞 완료 단계 기준, 현재 단계 = 발송', () => {
    const timeline = toOrderTimeline(partlyShipped)
    const shipped = timeline.steps[3]
    expect(shipped.at).toBeNull()
    expect(shipped.details.map((detail) => detail.label)).toEqual(['키들리상점', '꼬마옷장'])
    // 간격은 앞의 완료 단계(결제 완료 12:00:02) 기준
    expect(shipped.details[0].gapMs).toBe(2 * 3600_000 - 2000)
    expect(timeline.steps[1].gapMs).toBe(1000)
    expect(timeline.steps[3].current).toBe(true)
  })
  it('재고 부족 취소: 취소 단계를 취소로 표시한다', () => {
    const timeline = toOrderTimeline({
      orderId: '12',
      status: 'CANCELLED',
      currentStep: 'CANCELLED',
      cancelReason: 'OUT_OF_STOCK',
      paymentDueAt: null,
      steps: [
        step('CREATED', 'DONE', '2026-10-16T12:00:00'),
        step('PAYMENT_REQUESTED', 'NOT_APPLICABLE', null),
        step('CANCELLED', 'DONE', '2026-10-16T12:00:00', [], true),
        step('SHIPPED', 'NOT_APPLICABLE', null),
        step('DELIVERED', 'NOT_APPLICABLE', null),
        step('CONFIRMED', 'NOT_APPLICABLE', null),
      ],
    })
    expect(timeline.steps[2].cancelled).toBe(true)
    expect(timeline.steps[2].current).toBe(true)
  })
  it('모르는 단계 이름도 그대로 보여 준다 (개수 · 이름 가정 없음)', () => {
    const timeline = toOrderTimeline({
      orderId: '1',
      status: 'PAID',
      currentStep: 'NEW_STEP',
      cancelReason: null,
      paymentDueAt: null,
      steps: [
        {
          step: 'NEW_STEP',
          status: 'DONE',
          at: '2026-10-16T12:00:00',
          approximate: false,
          details: [],
        },
      ],
    })
    expect(timeline.steps[0].label).toBe('NEW_STEP')
  })
})
