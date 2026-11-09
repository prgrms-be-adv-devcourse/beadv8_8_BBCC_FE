import { describe, expect, it } from 'vitest'
import { canApproveWish, toWishOrder } from '@/features/decide-wish'

describe('조르기 승인 = 예약된 장바구니 칸으로 주문하기', () => {
  const line = {
    cartItemId: '30',
    optionId: '4',
    quantity: 2,
    maxQuantity: 3,
    unitPrice: 1000,
    purchasable: true,
  }
  const address = {
    recipientName: '부모',
    phone: '01012345678',
    zipCode: '12345',
    fullAddress: '서울',
  }

  it('고른 칸 · 수량 · 받는 자녀 · 배송지로 주문하기 입력을 만든다', () => {
    expect(toWishOrder('2', [line], address)).toEqual({
      items: [{ optionId: '4', childId: '2', quantity: 2, unitPrice: 1000, cartItemId: '30' }],
      shippingAddress: {
        recipientName: '부모',
        phone: '01012345678',
        zipCode: '12345',
        address: '서울',
      },
    })
  })

  it('수량은 1개부터 보낸 수량까지 (예약 칸은 담긴 수량보다 많이 주문할 수 없다)', () => {
    expect(canApproveWish([line], address)).toBe(true)
    expect(canApproveWish([{ ...line, quantity: 1 }], address)).toBe(true)
    expect(canApproveWish([{ ...line, quantity: 3 }], address)).toBe(true)
    expect(canApproveWish([{ ...line, quantity: 4 }], address)).toBe(false)
    expect(canApproveWish([{ ...line, quantity: 0 }], address)).toBe(false)
    expect(canApproveWish([{ ...line, quantity: -1 }], address)).toBe(false)
    expect(canApproveWish([{ ...line, quantity: 1.5 }], address)).toBe(false)
  })

  it('살 수 없는 칸 · 가격을 모르는 칸 · 칸 ID가 없는 줄(#999 전 조르기)은 승인할 수 없다', () => {
    expect(canApproveWish([], address)).toBe(false)
    expect(canApproveWish([{ ...line, purchasable: false }], address)).toBe(false)
    expect(canApproveWish([{ ...line, unitPrice: null }], address)).toBe(false)
    expect(canApproveWish([{ ...line, cartItemId: null }], address)).toBe(false)
    expect(canApproveWish([line, { ...line, cartItemId: '31', quantity: 0 }], address)).toBe(false)
    expect(canApproveWish([line], null)).toBe(false)
  })
})
