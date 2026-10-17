import { describe, expect, it } from 'vitest'
import {
  canStartSale,
  canStopSale,
  STOCK_REASON_LABEL,
  toProductEditForm,
  toProductSearchParams,
  toUpdateProductRequest,
  validateProductEditForm,
  validateStockAdjustment,
  type SellerProductDetail,
} from '@/entities/product'
import { validateBusinessName } from '@/entities/seller'

const product: SellerProductDetail = {
  id: '1',
  name: '데일리 맨투맨',
  status: 'ON_SALE',
  version: 0,
  brand: null,
  categoryId: '11',
  description: null,
  imageUrls: [],
  attributes: [],
  options: [
    {
      id: '1',
      name: '네이비 / 110',
      valueIds: ['101', '202'],
      price: 25000,
      stock: 10,
      onSale: true,
    },
  ],
  prices: [{ valueIds: [], price: 25000 }],
  sizeSpecs: [],
}

describe('판매 상태 전환', () => {
  it('판매 중지는 판매 중일 때만', () => {
    expect(canStopSale({ status: 'ON_SALE' })).toBe(true)
    expect(canStopSale({ status: 'SALE_PENDING' })).toBe(false)
    expect(canStopSale({ status: 'STOPPED' })).toBe(false)
  })
  it('판매 시작은 시작 전이거나 중지된 상품 (다시 판매)', () => {
    expect(canStartSale({ status: 'SALE_PENDING' })).toBe(true)
    expect(canStartSale({ status: 'STOPPED' })).toBe(true)
    expect(canStartSale({ status: 'ON_SALE' })).toBe(false)
  })
})

describe('validateStockAdjustment: 재고 조정 (사유 = BE InventoryAdjustmentReason)', () => {
  it('사유는 입고 · 불량 · 분실 · 정정', () => {
    expect(Object.keys(STOCK_REASON_LABEL)).toEqual(['RESTOCK', 'DEFECTIVE', 'LOST', 'CORRECTION'])
  })
  it('0은 바꿀 게 없다', () => {
    expect(validateStockAdjustment(10, 0, 'CORRECTION')).toBe('늘리거나 줄일 수량을 입력해 주세요.')
  })
  it('입고는 늘리기만, 불량 · 분실은 줄이기만', () => {
    expect(validateStockAdjustment(10, 5, 'RESTOCK')).toBeNull()
    expect(validateStockAdjustment(10, -1, 'RESTOCK')).toBe('입고는 재고를 늘릴 때만 써요.')
    expect(validateStockAdjustment(10, -1, 'DEFECTIVE')).toBeNull()
    expect(validateStockAdjustment(10, 1, 'LOST')).toBe('불량 · 분실은 재고를 줄일 때만 써요.')
  })
  it('재고를 모르면(null) 0 미만 검사는 서버에 맡긴다', () => {
    expect(validateStockAdjustment(null, -3, 'CORRECTION')).toBeNull()
  })
  it('조정 뒤 재고가 0 미만이면 안 된다 (경계: 정확히 0은 가능)', () => {
    expect(validateStockAdjustment(10, -10, 'CORRECTION')).toBeNull()
    expect(validateStockAdjustment(10, -11, 'CORRECTION')).toBe(
      '재고는 0보다 적어질 수 없어요 (지금 10개).',
    )
  })
  it('증감량은 ±1,000,000까지 (BE 검증, 경계)', () => {
    expect(validateStockAdjustment(null, 1_000_000, 'RESTOCK')).toBeNull()
    expect(validateStockAdjustment(null, 1_000_001, 'RESTOCK')).toBe(
      '한 번에 1,000,000개까지 조정할 수 있어요.',
    )
    expect(validateStockAdjustment(null, -1_000_000, 'CORRECTION')).toBeNull()
    expect(validateStockAdjustment(null, -1_000_001, 'CORRECTION')).toBe(
      '한 번에 1,000,000개까지 조정할 수 있어요.',
    )
  })
  it('소수는 안 된다', () => {
    expect(validateStockAdjustment(10, 1.5, 'RESTOCK')).toBe('수량은 정수로 입력해 주세요.')
  })
})

describe('상품 수정', () => {
  it('toProductEditForm: 상품명 · 옵션별 가격', () => {
    expect(toProductEditForm(product)).toEqual({
      name: '데일리 맨투맨',
      prices: { '1': 25000 },
    })
  })
  it('toUpdateProductRequest: 이름 앞뒤 공백 제거 · 옵션별 가격 배열', () => {
    expect(
      toUpdateProductRequest({
        name: ' 새 이름 ',
        prices: { '1': 27000 },
      }),
    ).toEqual({
      name: '새 이름',
      options: [{ optionId: '1', price: 27000 }],
    })
  })
  it('toUpdateProductRequest: 새로 올린 사진이 있으면 첫 사진을 대표로 바꾼다 (목: 교체만)', () => {
    const S3 = 'https://team04-kidly-s3.s3.ap-northeast-2.amazonaws.com/dev/products/7'
    expect(
      toUpdateProductRequest({ name: '이름', prices: { '1': 27000 } }, [
        `${S3}/a.jpg`,
        `${S3}/b.jpg`,
      ]),
    ).toEqual({
      name: '이름',
      options: [{ optionId: '1', price: 27000 }],
      thumbnailUrl: `${S3}/a.jpg`,
      imageUrls: [`${S3}/a.jpg`, `${S3}/b.jpg`],
    })
  })
  it('toUpdateProductRequest: 새로 올린 사진이 없으면 사진 칸을 보내지 않는다 (기존 사진 그대로)', () => {
    const request = toUpdateProductRequest({ name: '이름', prices: { '1': 27000 } }, [])
    expect(request).not.toHaveProperty('thumbnailUrl')
    expect(request).not.toHaveProperty('imageUrls')
  })
  it('validateProductEditForm: 이름 필수 · 가격은 1원 이상 (경계)', () => {
    const form = { name: '이름', prices: { '1': 1 } }
    expect(validateProductEditForm(form)).toBeNull()
    expect(validateProductEditForm({ ...form, name: ' ' })).toBe('상품명을 입력해 주세요.')
    expect(validateProductEditForm({ ...form, prices: { '1': 0 } })).toBe(
      '가격은 1원 이상이어야 해요.',
    )
  })
})

describe('toProductSearchParams: 검색 조건', () => {
  it('빈 값은 보내지 않는다', () => {
    expect(toProductSearchParams({ keyword: '  ', categoryId: null })).toEqual({})
  })
  it('검색어는 앞뒤 공백 제거', () => {
    expect(toProductSearchParams({ keyword: ' 맨투맨 ', categoryId: '1' })).toEqual({
      keyword: '맨투맨',
      categoryId: '1',
    })
  })
})

describe('validateBusinessName: 상호명 (BE NAME_MAX_LENGTH 50)', () => {
  it('비면 안내 · 50자 통과 · 51자 안내 (경계)', () => {
    expect(validateBusinessName(' ')).toBe('상호명을 입력해 주세요.')
    expect(validateBusinessName('가'.repeat(50))).toBeNull()
    expect(validateBusinessName('가'.repeat(51))).toBe('상호명은 50자까지예요.')
  })
})
