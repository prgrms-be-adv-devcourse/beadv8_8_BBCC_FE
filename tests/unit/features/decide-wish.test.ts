import { describe, expect, it } from 'vitest'
import { canApproveWish, toWishApproval } from '@/features/decide-wish'

describe('조르기 승인', () => {
  const line = { wishItemId: '3', quantity: 2, unitPrice: 1000, purchasable: true }
  const address = {
    recipientName: '부모',
    phone: '01012345678',
    zipCode: '12345',
    fullAddress: '서울',
  }
  it('선택 상품과 배송지로 승인 요청을 만든다', () => {
    expect(toWishApproval([line], address)).toEqual({
      checkout: 'ORDER',
      items: [{ wishItemId: 3, quantity: 2, unitPrice: 1000 }],
      shippingAddress: {
        recipientName: '부모',
        phone: '01012345678',
        zipCode: '12345',
        address: '서울',
      },
    })
  })
  it('수량 경계와 구매 불가 상품을 검증한다', () => {
    expect(canApproveWish([line], address)).toBe(true)
    expect(canApproveWish([], address)).toBe(false)
    expect(canApproveWish([{ ...line, quantity: 0 }], address)).toBe(false)
    expect(canApproveWish([{ ...line, quantity: 100 }], address)).toBe(false)
    expect(canApproveWish([{ ...line, purchasable: false }], address)).toBe(false)
    expect(canApproveWish([{ ...line, quantity: 1 }], address)).toBe(true)
    expect(canApproveWish([{ ...line, quantity: 99 }], address)).toBe(true)
    expect(canApproveWish([{ ...line, quantity: -1 }], address)).toBe(false)
    expect(canApproveWish([{ ...line, quantity: 1.5 }], address)).toBe(false)
    expect(canApproveWish([{ ...line, unitPrice: null }], address)).toBe(false)
    expect(canApproveWish([line, { ...line, wishItemId: '4', quantity: 0 }], address)).toBe(false)
    expect(canApproveWish([line], null)).toBe(false)
  })
})
