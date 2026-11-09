import { describe, expect, it } from 'vitest'
import { toCart } from '@/entities/cart'

describe('장바구니 응답 변환 (회원 · 자녀 공용 GET /cart, BE #998)', () => {
  const line = {
    cartItemId: '30',
    optionId: '4',
    productId: '7',
    sellerId: '9',
    sellerName: '키즐리',
    productName: '맨투맨',
    optionName: '네이비 / 110',
    size: '110',
    childId: '2',
    quantity: 2,
    unitPrice: 25000,
    purchasable: true,
    lineAmount: 50000,
    reserved: false,
  }
  it('조르기에 예약된 칸인지(reserved)를 옮긴다', () => {
    const cart = toCart({
      items: [line, { ...line, cartItemId: '31', reserved: true }],
      totalAmount: 0,
    })
    expect(cart.lines.map((item) => [item.id, item.reserved])).toEqual([
      ['30', false],
      ['31', true],
    ])
  })
})
