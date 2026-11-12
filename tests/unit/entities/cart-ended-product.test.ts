import { describe, expect, it } from 'vitest'
import { toCart } from '@/entities/cart'
import { validate } from '@/shared/api/contract'
import { cartShape } from '@/entities/cart/api/cart.shape'

// BE CartResponse.Line: 상품 복사본이 없는 줄은 상품 필드(productId · sellerId · productName · optionName · size · unitPrice · sellerName)가 null
const ended = {
  cartItemId: '40',
  optionId: '4',
  productId: null,
  sellerId: null,
  sellerName: null,
  productName: null,
  optionName: null,
  size: null,
  childId: null,
  quantity: 1,
  unitPrice: null,
  purchasable: false,
  lineAmount: 0,
  reserved: false,
}

describe('판매가 끝나 상품 정보가 없는 장바구니 줄', () => {
  it('계약 모양: 상품 필드 null 허용', () => {
    expect(validate({ items: [ended], totalAmount: 0 }, cartShape)).toEqual([])
  })

  it('매퍼: 상품명 대신 "판매가 끝난 상품", 상품 번호는 null', () => {
    const [line] = toCart({ items: [ended], totalAmount: 0 }).lines
    expect(line).toMatchObject({
      productId: null,
      productName: '판매가 끝난 상품',
      purchasable: false,
    })
  })
})
