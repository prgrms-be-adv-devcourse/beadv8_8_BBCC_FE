import { describe, expect, it } from 'vitest'
import { toCart } from '@/entities/cart'
import type { CartLineDto } from '@/entities/cart/api/cart.dto'
import { toChildPurchase, toOrder } from '@/entities/order'
import type {
  ChildPurchaseDto,
  OrderDetailDto,
  OrderItemDto,
  OrderSummaryDto,
} from '@/entities/order/api/order.dto'
import { toOrderSummary } from '@/entities/order/model/order.mapper'
import { lineImageUrl, productIdsWithoutImage } from '@/entities/product'
import { toWishRequest, type MockWishRequestDto } from '@/entities/wish'

// BE #1328: 주문 · 장바구니 · 조르기 응답의 상품 사진. 없으면(null · 빈 글자) 상품 상세 대표 사진으로 대체한다
describe('응답 사진 (BE #1328)', () => {
  it('주문 목록: 대표 상품 ID · 대표 사진', () => {
    const base = {
      orderId: '1',
      status: 'PAID',
      totalAmount: 1000,
      orderedAt: '2026-11-13T10:00:00',
      representativeProductName: '맨투맨',
      itemCount: 1,
      sellerName: null,
    }
    const summary = toOrderSummary({
      ...base,
      representativeProductId: '7',
      representativeThumbnailUrl: 'https://img/7.jpg',
    } as OrderSummaryDto)
    expect([summary.productId, summary.thumbnailUrl]).toEqual(['7', 'https://img/7.jpg'])
    const old = toOrderSummary(base as OrderSummaryDto)
    expect([old.productId, old.thumbnailUrl]).toEqual([null, null])
  })

  it('주문 상세 주문상품 · 자녀 구매 내역: 주문 당시 사진', () => {
    const item = { orderItemId: '3', productId: '7', thumbnailUrl: 'https://img/old.jpg' }
    const order = toOrder({
      orderId: '1',
      status: 'PAID',
      cancelReason: null,
      totalAmount: 1000,
      orderedAt: '2026-11-13T10:00:00',
      paymentDueAt: null,
      shippingAddress: { recipientName: '가', phone: '010', zipCode: '1', address: '서울' },
      items: [item as OrderItemDto, { ...item, thumbnailUrl: '  ' } as OrderItemDto],
      deliveries: [],
    } as OrderDetailDto)
    expect(order.items.map((it) => it.thumbnailUrl)).toEqual(['https://img/old.jpg', null])
    expect(
      toChildPurchase({ orderItemId: '3', thumbnailUrl: 'https://img/c.jpg' } as ChildPurchaseDto)
        .thumbnailUrl,
    ).toBe('https://img/c.jpg')
    expect(toChildPurchase({ orderItemId: '3' } as ChildPurchaseDto).thumbnailUrl).toBeNull()
  })

  it('장바구니 줄 · 조르기 줄: 지금 사진', () => {
    const cart = toCart({
      items: [
        { cartItemId: '1', thumbnailUrl: 'https://img/a.jpg' } as CartLineDto,
        { cartItemId: '2', thumbnailUrl: null } as CartLineDto,
      ],
      totalAmount: 0,
    })
    expect(cart.lines.map((line) => line.thumbnailUrl)).toEqual(['https://img/a.jpg', null])
    const wish = toWishRequest({
      items: [{ cartItemId: '1', thumbnailUrl: 'https://img/w.jpg' }],
      purchases: [],
      paidOrderItemIds: [],
    } as unknown as MockWishRequestDto)
    expect(wish.items[0].thumbnailUrl).toBe('https://img/w.jpg')
  })

  it('상품 상세로 대신 읽을 상품: 응답 사진이 없는 줄의 상품만', () => {
    expect(
      productIdsWithoutImage([
        { productId: '1', thumbnailUrl: 'a.jpg' },
        { productId: '2', thumbnailUrl: null },
        { productId: null, thumbnailUrl: null },
      ]),
    ).toEqual(['2', null])
  })

  it('줄 사진: 응답 사진 → 상품 상세 대표 사진 → null', () => {
    const fallback = { '2': 'detail.jpg' }
    expect(lineImageUrl({ productId: '2', thumbnailUrl: 'line.jpg' }, fallback)).toBe('line.jpg')
    expect(lineImageUrl({ productId: '2', thumbnailUrl: null }, fallback)).toBe('detail.jpg')
    expect(lineImageUrl({ productId: '3', thumbnailUrl: null }, fallback)).toBeNull()
    expect(lineImageUrl({ productId: null, thumbnailUrl: null }, fallback)).toBeNull()
  })
})
