import { describe, expect, it } from 'vitest'
import { buildOrderTimeline } from '@/app/mocks/order-handlers'
import { formatGap, toOrderTimeline, type OrderDetailDto } from '@/entities/order'

const base: OrderDetailDto = {
  orderId: '12',
  status: 'PAID',
  cancelReason: null,
  totalAmount: 50000,
  orderedAt: '2026-10-16T12:00:00',
  paymentDueAt: null,
  shippingAddress: { recipientName: '가', phone: '010', zipCode: '1', address: '서울' },
  items: [41, 42].map((id, index) => ({
    orderItemId: String(id),
    productId: '1',
    optionId: '1',
    sellerId: index === 0 ? '5' : '8',
    sellerName: index === 0 ? '키들리상점' : '꼬마옷장',
    productName: index === 0 ? '아동 티셔츠' : '아동 바지',
    optionName: null,
    size: null,
    unitPrice: 25000,
    quantity: 1,
    amount: 25000,
    status: 'ORDERED',
    deliveredAt: null,
    confirmedAt: null,
    confirmType: null,
    child: null,
  })),
  deliveries: [
    {
      sellerOrderId: '31',
      sellerId: '5',
      status: 'SHIPPING',
      carrier: null,
      trackingNumber: null,
      shippedAt: '2026-10-16T14:00:00',
      deliveredAt: null,
    },
    {
      sellerOrderId: '32',
      sellerId: '8',
      status: 'READY',
      carrier: null,
      trackingNumber: null,
      shippedAt: null,
      deliveredAt: null,
    },
  ],
}
const payment = {
  paymentId: 1,
  orderId: 12,
  amount: 50000,
  refundedAmount: 0,
  status: 'COMPLETED',
  failureCode: null,
  paidAt: '2026-10-16T12:00:02',
  createdAt: '2026-10-16T12:00:01',
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
  it('일부 발송: 단계는 순서대로, 발송은 PARTIAL + 판매자별 details, 현재 단계 = 발송', () => {
    const dto = buildOrderTimeline(base, payment)
    expect(dto.steps.map((step) => `${step.step}:${step.status}`)).toEqual([
      'CREATED:DONE',
      'PAYMENT_REQUESTED:DONE',
      'PAID:DONE',
      'SHIPPED:PARTIAL',
      'DELIVERED:WAITING',
      'CONFIRMED:WAITING',
    ])
    expect(dto.currentStep).toBe('SHIPPED')
    const timeline = toOrderTimeline(dto)
    const shipped = timeline.steps[3]
    expect(shipped.at).toBeNull()
    expect(shipped.details.map((detail) => detail.label)).toEqual(['키들리상점', '꼬마옷장'])
    // 간격은 앞의 완료 단계(결제 완료 12:00:02) 기준
    expect(shipped.details[0].gapMs).toBe(2 * 3600_000 - 2000)
    expect(timeline.steps[1].gapMs).toBe(1000)
    expect(timeline.steps[3].current).toBe(true)
  })
  it('재고 부족 취소: 결제 요청 해당 없음 → 취소(approximate) → 나머지 해당 없음, PAID 없음', () => {
    const dto = buildOrderTimeline(
      { ...base, status: 'CANCELLED', cancelReason: 'OUT_OF_STOCK', deliveries: [] },
      null,
    )
    expect(dto.steps.map((step) => `${step.step}:${step.status}`)).toEqual([
      'CREATED:DONE',
      'PAYMENT_REQUESTED:NOT_APPLICABLE',
      'CANCELLED:DONE',
      'SHIPPED:NOT_APPLICABLE',
      'DELIVERED:NOT_APPLICABLE',
      'CONFIRMED:NOT_APPLICABLE',
    ])
    expect(dto.currentStep).toBe('CANCELLED')
    expect(dto.steps[2].approximate).toBe(true)
    expect(toOrderTimeline(dto).steps[2].cancelled).toBe(true)
  })
  it('결제대기: 결제 마감을 준다, 결제 완료 뒤에는 null', () => {
    const pending = buildOrderTimeline(
      { ...base, status: 'PENDING_PAYMENT', paymentDueAt: '2026-10-16T12:10:00', deliveries: [] },
      null,
    )
    expect(pending.paymentDueAt).toBe('2026-10-16T12:10:00')
    expect(pending.currentStep).toBe('CREATED')
    expect(buildOrderTimeline(base, payment).paymentDueAt).toBeNull()
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
