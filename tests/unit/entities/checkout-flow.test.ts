import { describe, expect, it } from 'vitest'
import { isAllSelected, selectedLines, type Cart, type CartLine } from '@/entities/cart'
import { suggestChargeAmount } from '@/entities/wallet'
import { safeReturnPath } from '@/shared/lib'

const line = (id: string, patch: Partial<CartLine> = {}): CartLine => ({
  id,
  optionId: `o${id}`,
  productId: 'p1',
  sellerId: '2',
  sellerName: null,
  productName: '데일리 맨투맨',
  optionName: '네이비 / 120',
  size: '120',
  childId: null,
  quantity: 1,
  unitPrice: 25000,
  purchasable: true,
  lineAmount: 25000,
  ...patch,
})
const cart: Cart = {
  lines: [line('1'), line('2'), line('3', { purchasable: false }), line('4', { unitPrice: null })],
  totalAmount: 50000,
}

describe('장바구니 선택 주문', () => {
  it('처음에는 주문할 수 있는 줄이 모두 선택된다', () => {
    expect(selectedLines(cart, new Set()).map((item) => item.id)).toEqual(['1', '2'])
    expect(isAllSelected(cart, new Set())).toBe(true)
  })

  it('선택을 뺀 줄은 주문하지 않는다', () => {
    expect(selectedLines(cart, new Set(['2'])).map((item) => item.id)).toEqual(['1'])
    expect(isAllSelected(cart, new Set(['2']))).toBe(false)
  })

  it('구매 불가 · 단가 없는 줄은 선택 여부와 상관없이 빠진다', () => {
    expect(selectedLines(cart, new Set(['9'])).map((item) => item.id)).toEqual(['1', '2'])
  })

  it('주문할 수 있는 줄이 없으면 전체 선택이 아니다', () => {
    expect(
      isAllSelected({ lines: [line('3', { purchasable: false })], totalAmount: 0 }, new Set()),
    ).toBe(false)
  })
})

describe('suggestChargeAmount: 부족한 만큼 충전할 금액', () => {
  it('천 원 단위로 올린다', () => {
    expect(suggestChargeAmount(12_300)).toBe(13_000)
    expect(suggestChargeAmount(25_000)).toBe(25_000)
  })

  it('충전 한도(1천 원 ~ 100만 원) 안으로 맞춘다', () => {
    expect(suggestChargeAmount(1)).toBe(1_000)
    expect(suggestChargeAmount(3_000_000)).toBe(1_000_000)
  })

  it('부족하지 않으면 null', () => {
    expect(suggestChargeAmount(0)).toBeNull()
    expect(suggestChargeAmount(-500)).toBeNull()
  })
})

describe('safeReturnPath: 돌아갈 주소는 앱 안 주소만', () => {
  it('앱 안 주소는 그대로', () => {
    expect(safeReturnPath('/cart')).toBe('/cart')
    expect(safeReturnPath('/products/1?childId=2')).toBe('/products/1?childId=2')
  })

  it('외부 · 이상한 주소는 null', () => {
    expect(safeReturnPath('https://evil.example')).toBeNull()
    expect(safeReturnPath('//evil.example')).toBeNull()
    expect(safeReturnPath('/\\evil.example')).toBeNull()
    expect(safeReturnPath('cart')).toBeNull()
    expect(safeReturnPath('')).toBeNull()
    expect(safeReturnPath(null)).toBeNull()
  })
})
