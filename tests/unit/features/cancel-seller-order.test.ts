import { describe, expect, it } from 'vitest'
import {
  cancelledMoneyNote,
  cancelledRefundOf,
  sellerGroupCancelled,
  type OrderItem,
} from '@/entities/order'
import { canCancelSellerOrder } from '@/entities/seller-order'
import { toSellerOrder } from '@/entities/seller-order/model/seller-order.mapper'
import {
  SELLER_CANCEL_REASONS,
  toCancelSellerOrderRequest,
  validateCancelMemo,
} from '@/features/cancel-seller-order'

describe('판매자 발송 전 취소 (BE #655)', () => {
  it('발송 준비일 때만 취소할 수 있다', () => {
    expect(canCancelSellerOrder({ status: 'READY' })).toBe(true)
    for (const status of ['SHIPPING', 'DELIVERED', 'CANCELLED'] as const)
      expect(canCancelSellerOrder({ status })).toBe(false)
  })
  it('사유는 BE SellerCancelReason 세 가지, 화면 순서대로', () => {
    expect(SELLER_CANCEL_REASONS).toEqual([
      { value: 'OUT_OF_STOCK', label: '재고 없음' },
      { value: 'WRONG_PRODUCT_INFO', label: '상품 정보 오류' },
      { value: 'OTHER', label: '판매자 사정' },
    ])
  })
  it('요청: 메모는 앞뒤 공백을 빼고, 비면 보내지 않는다', () => {
    expect(toCancelSellerOrderRequest({ reason: 'OUT_OF_STOCK', memo: '  재입고 미정 ' })).toEqual({
      reason: 'OUT_OF_STOCK',
      memo: '재입고 미정',
    })
    expect(toCancelSellerOrderRequest({ reason: 'OTHER', memo: '   ' })).toEqual({
      reason: 'OTHER',
    })
  })
  it('메모는 500자까지 (경계값)', () => {
    expect(validateCancelMemo('가'.repeat(500))).toBeNull()
    expect(validateCancelMemo('가'.repeat(501))).toBe('메모는 500자까지예요.')
    expect(validateCancelMemo('')).toBeNull()
  })
})

describe('구매자 화면: 판매자 취소 환불 안내', () => {
  const item = (id: string, status: OrderItem['status'], amount: number) =>
    ({ id, status, amount }) as OrderItem
  it('취소된 상품 금액만 더한다', () => {
    expect(cancelledRefundOf([item('1', 'CANCELLED', 25000), item('2', 'CANCELLED', 22000)])).toBe(
      47000,
    )
    expect(cancelledRefundOf([item('1', 'CANCELLED', 25000), item('2', 'ORDERED', 22000)])).toBe(
      25000,
    )
    expect(cancelledRefundOf([item('1', 'ORDERED', 25000)])).toBe(0)
  })
  it('판매자 묶음이 취소됐는지: 배송이 취소됐거나 상품이 모두 취소', () => {
    expect(
      sellerGroupCancelled({ delivery: { status: 'CANCELLED' }, items: [item('1', 'ORDERED', 1)] }),
    ).toBe(true)
    expect(sellerGroupCancelled({ delivery: null, items: [item('1', 'CANCELLED', 1)] })).toBe(true)
    expect(
      sellerGroupCancelled({
        delivery: { status: 'READY' },
        items: [item('1', 'CANCELLED', 1), item('2', 'ORDERED', 1)],
      }),
    ).toBe(false)
  })
})

describe('판매 주문 매퍼: 취소된 주문상품', () => {
  const line = (status: string) => ({
    orderItemId: '7',
    productId: '1',
    optionId: '2',
    sellerId: '2',
    productName: '데일리 맨투맨',
    optionName: null,
    size: '110',
    unitPrice: 25000,
    quantity: 1,
    amount: 25000,
    status,
    deliveredAt: null,
    confirmedAt: null,
    confirmType: null,
    unavailableReason: null,
    sellerName: null,
  })
  const dto = {
    sellerOrderId: '11',
    orderId: '16',
    status: 'CANCELLED',
    carrier: null,
    trackingNumber: null,
    shippedAt: null,
    deliveredAt: null,
    orderedAt: '2026-11-12T11:00:00',
    shippingAddress: { recipientName: '홍길동', phone: '010', zipCode: '1', address: '서울' },
    items: [line('CANCELLED'), line('ORDERED')],
  }
  it('주문상품 CANCELLED만 취소로 표시한다', () => {
    expect(toSellerOrder(dto as never).items.map((item) => item.isCancelled)).toEqual([true, false])
  })
})

describe('구매자 화면: 취소된 주문의 예치금 안내', () => {
  it('결제 전에 취소된 주문은 빠져나가지 않았다', () => {
    for (const reason of ['OUT_OF_STOCK', 'PAYMENT_FAILED', 'PAYMENT_EXPIRED', null] as const)
      expect(cancelledMoneyNote(reason)).toBe('예치금은 빠져나가지 않았어요.')
  })
  it('결제 뒤 취소(구매자 · 판매자 · 시스템)는 돌려받는다', () => {
    for (const reason of ['BUYER_CANCELLED', 'SELLER_CANCELLED', 'SELLER_UNAVAILABLE'] as const)
      expect(cancelledMoneyNote(reason)).toBe('결제한 예치금은 돌려드렸어요.')
  })
})
