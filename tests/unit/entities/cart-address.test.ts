import { describe, expect, it } from 'vitest'
import {
  pickShippingAddress,
  toAddressRequest,
  validateAddressForm,
  type AddressForm,
  type ShippingAddress,
} from '@/entities/address'
import {
  canDecrease,
  orderableLines,
  sumLineAmount,
  toAddCartItemRequest,
  type Cart,
  type CartLine,
} from '@/entities/cart'

const line = (patch: Partial<CartLine>): CartLine => ({
  id: '1',
  optionId: '2',
  productId: '1',
  productName: '맨투맨',
  size: '120',
  childId: null,
  quantity: 1,
  unitPrice: 25000,
  purchasable: true,
  lineAmount: 25000,
  ...patch,
})

describe('장바구니 규칙', () => {
  it('구매할 수 없거나 단가가 없는 줄은 주문에서 뺀다', () => {
    const cart: Cart = {
      lines: [
        line({ id: 'a' }),
        line({ id: 'b', purchasable: false }),
        line({ id: 'c', unitPrice: null }),
      ],
      totalAmount: 0,
    }
    expect(orderableLines(cart).map((item) => item.id)).toEqual(['a'])
  })
  it('주문 금액은 줄 금액의 합이다', () => {
    expect(sumLineAmount([line({ lineAmount: 25000 }), line({ lineAmount: 60000 })])).toBe(85000)
    expect(sumLineAmount([])).toBe(0)
  })
  it('수량 1에서는 더 줄일 수 없다 (경계)', () => {
    expect(canDecrease(line({ quantity: 1 }))).toBe(false)
    expect(canDecrease(line({ quantity: 2 }))).toBe(true)
  })
  it('담기 요청은 ID를 숫자로 보낸다', () => {
    expect(toAddCartItemRequest({ optionId: '2', childId: '1', quantity: 3 })).toEqual({
      optionId: 2,
      childId: 1,
      quantity: 3,
    })
    expect(toAddCartItemRequest({ optionId: '2', childId: null, quantity: 1 }).childId).toBeNull()
  })
})

const form = (patch: Partial<AddressForm> = {}): AddressForm => ({
  recipientName: '홍길동',
  phone: '010-1234-5678',
  zipCode: '04524',
  roadAddress: '서울시 테스트로 1',
  detailAddress: '',
  isDefault: true,
  ...patch,
})

describe('배송지 규칙', () => {
  it('정상 입력은 통과한다', () => {
    expect(validateAddressForm(form())).toBeNull()
  })
  it('연락처는 010-1234-5678 형식만 받는다', () => {
    expect(validateAddressForm(form({ phone: '01012345678' }))).not.toBeNull()
    expect(validateAddressForm(form({ phone: '010-123-5678' }))).not.toBeNull()
  })
  it('받는 분 · 우편번호 · 주소가 비면 막는다', () => {
    expect(validateAddressForm(form({ recipientName: ' ' }))).not.toBeNull()
    expect(validateAddressForm(form({ zipCode: '' }))).not.toBeNull()
  })
  it('빈 상세 주소는 null로 보낸다', () => {
    expect(toAddressRequest(form({ detailAddress: '  ' })).detailAddress).toBeNull()
  })

  const list: ShippingAddress[] = [
    {
      id: '1',
      recipientName: 'A',
      phone: '',
      zipCode: '',
      roadAddress: '',
      detailAddress: null,
      fullAddress: '',
      isDefault: false,
    },
    {
      id: '2',
      recipientName: 'B',
      phone: '',
      zipCode: '',
      roadAddress: '',
      detailAddress: null,
      fullAddress: '',
      isDefault: true,
    },
  ]
  it('고른 배송지가 없으면 기본 배송지를 쓴다', () => {
    expect(pickShippingAddress(list, null)?.id).toBe('2')
    expect(pickShippingAddress(list, '1')?.id).toBe('1')
    expect(pickShippingAddress([], null)).toBeNull()
  })
})
