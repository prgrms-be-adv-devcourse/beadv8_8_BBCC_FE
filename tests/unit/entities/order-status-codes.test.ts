import { describe, expect, it } from 'vitest'
import {
  CANCEL_REASON_LABEL,
  ITEM_CANCEL_REASON_LABEL,
  ITEM_STATUS_LABEL,
  TIMELINE_CANCEL_LABEL,
} from '@/entities/order'
import {
  nextShippingStep,
  SELLER_ORDER_TABS,
  sellerOrderStatusOfTab,
  sellerOrderTabOf,
  type SellerOrder,
} from '@/entities/seller-order'
import { wishStatusLabel, wishTimelineLabel } from '@/entities/wish'
import { DELIVERY_STATUS_LABEL } from '@/shared/config'

// BE develop 코드표 (Order.CancelReason · OrderItem.Status · OrderItem.CancelReason · Delivery.Status · WishRequest.Status)
const ORDER_CANCEL_REASONS = [
  'OUT_OF_STOCK',
  'PAYMENT_FAILED',
  'PAYMENT_EXPIRED',
  'BUYER_CANCELLED',
  'SELLER_CANCELLED',
  'SELLER_UNAVAILABLE',
]

describe('주문 코드표가 BE 값을 모두 안다', () => {
  it.each(ORDER_CANCEL_REASONS)('주문 취소 사유 %s', (code) => {
    expect(CANCEL_REASON_LABEL[code as keyof typeof CANCEL_REASON_LABEL]).toBeTruthy()
    expect(TIMELINE_CANCEL_LABEL[code]).toBeTruthy()
  })
  it('판매자 · 시스템 취소 사유 문구', () => {
    expect(CANCEL_REASON_LABEL.BUYER_CANCELLED).toBe('주문을 취소했어요.')
    expect(CANCEL_REASON_LABEL.SELLER_CANCELLED).toBe('판매자가 주문을 취소했어요.')
    expect(CANCEL_REASON_LABEL.SELLER_UNAVAILABLE).toBe(
      '판매자 사정으로 판매할 수 없게 되어 주문이 취소됐어요.',
    )
  })
  it('주문상품 상태 CANCELLED는 주문됨과 다르게', () => {
    expect(ITEM_STATUS_LABEL.CANCELLED).toBe('취소됨')
    expect(ITEM_STATUS_LABEL.CANCELLED).not.toBe(ITEM_STATUS_LABEL.ORDERED)
  })
  it.each([
    ['OUT_OF_STOCK', '재고 없음'],
    ['WRONG_PRODUCT_INFO', '상품 정보 오류'],
    ['OTHER', '판매자 사정'],
    ['SELLER_UNAVAILABLE', '판매자 사정으로 판매 불가'],
  ])('주문상품 취소 사유 %s → %s', (code, label) => {
    expect(ITEM_CANCEL_REASON_LABEL[code as keyof typeof ITEM_CANCEL_REASON_LABEL]).toBe(label)
  })
  it('배송 상태 CANCELLED', () => {
    expect(DELIVERY_STATUS_LABEL.CANCELLED).toBe('취소됨')
  })
})

describe('조르기 EXPIRED', () => {
  it('상태 라벨', () => {
    expect(wishStatusLabel({ status: 'EXPIRED' })).toBe('기한 지나 만료')
  })
  it('타임라인 단계 라벨', () => {
    expect(wishTimelineLabel('EXPIRED')).toBe('기한 지나 만료')
  })
})

describe('판매자 주문 · 배송 탭의 취소', () => {
  const order = (id: string, status: SellerOrder['status']) => ({ id, status }) as SellerOrder

  it('취소 탭이 전체 앞에 있다', () => {
    expect(SELLER_ORDER_TABS.map((tab) => tab.value)).toEqual([
      'READY',
      'SHIPPING',
      'DELIVERED',
      'CANCELLED',
      'ALL',
    ])
    expect(SELLER_ORDER_TABS.find((tab) => tab.value === 'CANCELLED')?.label).toBe('취소')
  })
  it('주소 ?tab=CANCELLED를 읽는다', () => {
    expect(sellerOrderTabOf('CANCELLED')).toBe('CANCELLED')
  })
  it('취소 탭은 취소된 배송만 서버에 묻는다', () => {
    expect(sellerOrderStatusOfTab('CANCELLED')).toBe('CANCELLED')
  })
  it('취소된 배송은 다음 처리가 없다', () => {
    expect(nextShippingStep(order('2', 'CANCELLED'))).toBeNull()
  })
})
