import { describe, expect, it } from 'vitest'
import { orderProcess } from '@/entities/order'

describe('주문 서버 처리 단계 (주문 접수 → 재고 확보 → 예치금 결제)', () => {
  const states = (order: Parameters<typeof orderProcess>[0]) =>
    orderProcess(order).map((step) => [step.label, step.state, step.note ?? null])

  it('결제대기: 접수 끝 · 재고 확보 처리 중 · 결제 대기', () => {
    expect(states({ status: 'PENDING_PAYMENT', cancelReason: null })).toEqual([
      ['주문 접수', 'done', null],
      ['재고 확보', 'active', null],
      ['예치금 결제', 'waiting', null],
    ])
  })
  it('결제 완료: 모두 끝', () => {
    expect(
      orderProcess({ status: 'PAID', cancelReason: null }).every((s) => s.state === 'done'),
    ).toBe(true)
  })
  it('재고 부족 · 판매 중지: 재고 확보에서 실패, 결제는 건너뜀', () => {
    expect(states({ status: 'CANCELLED', cancelReason: 'OUT_OF_STOCK' })).toEqual([
      ['주문 접수', 'done', null],
      ['재고 확보', 'failed', '구매할 수 없는 상품'],
      ['예치금 결제', 'skipped', null],
    ])
  })
  it('잔액 부족: 결제에서 실패, 확보했던 재고는 복구', () => {
    expect(states({ status: 'CANCELLED', cancelReason: 'PAYMENT_FAILED' }).slice(1)).toEqual([
      ['재고 확보', 'done', '재고 복구됨'],
      ['예치금 결제', 'failed', '잔액 부족'],
    ])
  })
  it('시간 초과: 결제에서 시간 초과', () => {
    expect(states({ status: 'CANCELLED', cancelReason: 'PAYMENT_EXPIRED' }).at(-1)).toEqual([
      '예치금 결제',
      'failed',
      '시간 초과',
    ])
  })
})

describe('사이즈 추천: 그림에 쓸 사이즈별 권장 키', () => {
  it('응답의 sizes를 그대로 옮긴다', async () => {
    const { toSizeRecommendation } = await import('@/entities/recommendation')
    expect(
      toSizeRecommendation({
        productId: '1',
        childId: '2',
        recommendedSize: '120',
        fit: 'ROOMY',
        reasons: [],
        sizes: [
          { size: '110', minHeightCm: 105, maxHeightCm: 115, fit: 'TIGHT' },
          { size: '120', minHeightCm: 115, maxHeightCm: 125, fit: 'ROOMY' },
        ],
      }).sizes,
    ).toEqual([
      { size: '110', minHeightCm: 105, maxHeightCm: 115, fit: 'TIGHT' },
      { size: '120', minHeightCm: 115, maxHeightCm: 125, fit: 'ROOMY' },
    ])
  })
})
