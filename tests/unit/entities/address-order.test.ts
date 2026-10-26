import { describe, expect, it } from 'vitest'
import { defaultFirst, type ShippingAddress } from '@/entities/address'

const address = (id: string, isDefault = false): ShippingAddress => ({
  id,
  recipientName: '홍길동',
  phone: '010-0000-0000',
  zipCode: '04524',
  roadAddress: '서울시 테스트로 1',
  detailAddress: null,
  fullAddress: '서울시 테스트로 1',
  isDefault,
})

describe('defaultFirst', () => {
  it('기본 배송지를 맨 위로 올리고 나머지는 받은 순서를 지킨다', () => {
    const list = [address('1'), address('2'), address('3', true), address('4')]
    expect(defaultFirst(list).map((a) => a.id)).toEqual(['3', '1', '2', '4'])
  })

  it('기본 배송지가 없으면 순서를 바꾸지 않는다', () => {
    const list = [address('1'), address('2')]
    expect(defaultFirst(list).map((a) => a.id)).toEqual(['1', '2'])
  })

  it('받은 배열은 바꾸지 않는다', () => {
    const list = [address('1'), address('2', true)]
    defaultFirst(list)
    expect(list.map((a) => a.id)).toEqual(['1', '2'])
  })
})
