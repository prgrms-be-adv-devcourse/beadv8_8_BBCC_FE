import { describe, expect, it } from 'vitest'
import {
  canChangeProduct,
  canDelist,
  canStartSale,
  canStopSale,
  PRODUCT_STATUS_LABEL,
  productIdFromInput,
  type ProductStatus,
} from '@/entities/product'
import { saleStatusResultShape } from '@/entities/product/api/product.shape'
import { validate } from '@/shared/api'

// 등록 취소(DELISTED): 판매자가 더 팔지 않겠다고 내린 상품. 판매자는 되돌릴 수 없고,
// 판매 상태 · 상품 정보 · 재고를 바꾸면 BE가 409로 거절한다. 관리자만 판매 중지로 되돌린다

const ALL: ProductStatus[] = ['SALE_PENDING', 'ON_SALE', 'STOPPED', 'DELISTED']
const of = (status: ProductStatus) => ({ status })

describe('등록 취소 상태 규칙', () => {
  it.each([
    ['SALE_PENDING', true],
    ['ON_SALE', true],
    ['STOPPED', true],
    ['DELISTED', false],
  ] as const)(
    '%s 상품은 판매자가 등록 취소 · 수정 · 재고 조정할 수 있는가: %s',
    (status, expected) => {
      expect(canDelist(of(status))).toBe(expected)
      expect(canChangeProduct(of(status))).toBe(expected)
    },
  )

  it('등록 취소한 상품은 판매 시작 · 판매 중지도 할 수 없다', () => {
    expect(canStartSale(of('DELISTED'))).toBe(false)
    expect(canStopSale(of('DELISTED'))).toBe(false)
  })

  it('네 상태 모두 화면 라벨이 있다', () => {
    expect(ALL.map((status) => PRODUCT_STATUS_LABEL[status])).toEqual([
      '판매 시작 전',
      '판매 중',
      '판매 중지',
      '등록 취소',
    ])
  })
})

describe('판매 상태 응답 모양 (BE ProductSaleStatusResponse)', () => {
  it('등록 취소 응답은 모양과 맞는다', () => {
    const response = { productId: '7', status: 'DELISTED', version: 3 }
    expect(validate(response, saleStatusResultShape)).toEqual([])
  })
})

describe('productIdFromInput: 관리자가 넣은 상품 번호', () => {
  it.each([
    ['100', '100'],
    [' #100 ', '100'],
    ['#7', '7'],
  ])('%j → %s', (input, expected) => {
    expect(productIdFromInput(input)).toBe(expected)
  })

  it.each(['', '  ', '#', 'abc', '10a', '-3', '0', '1.5'])('%j는 상품 번호가 아니다', (input) => {
    expect(productIdFromInput(input)).toBeNull()
  })
})
