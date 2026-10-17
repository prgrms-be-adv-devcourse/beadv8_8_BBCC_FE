import { describe, expect, it } from 'vitest'
import {
  canStartSale,
  canStopSale,
  STOCK_REASON_LABEL,
  toProductSearchParams,
  validateStockAdjustment,
} from '@/entities/product'
import { validateBusinessName } from '@/entities/seller'

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
