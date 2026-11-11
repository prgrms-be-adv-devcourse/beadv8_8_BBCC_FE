import { describe, expect, it } from 'vitest'
import {
  partsForPurchase,
  toPurchasedGarment,
  toReferenceGarmentFormFromPurchase,
} from '@/entities/recommendation'

// 기준 옷 「산 옷에서 고르기」: 자녀에게 산 옷 중 구매확정된 것 (GET /recommendations/children/{childId}/purchases).
// 상품 정보가 없으면 상품 이름 · 카테고리 · 칸 · 실측이 null, 산 사이즈의 실측이 없으면 실측만 null.
// 칸(part)은 서버가 카테고리로 정하고, 기준 옷이 아닌 옷(모자 · 양말)이면 null (BE #1249)

describe('산 옷 목록 변환', () => {
  it('응답 한 줄을 그대로 옮긴다 (실측은 항목 코드 → cm)', () => {
    expect(
      toPurchasedGarment({
        orderItemId: '31',
        productId: '7',
        productName: '데일리 맨투맨',
        categoryId: '11',
        part: 'TOP',
        size: '110',
        measurements: { TOTAL_LENGTH: 42, CHEST_WIDTH: 34.5 },
        confirmedAt: '2026-11-04T10:00:00',
      }),
    ).toEqual({
      orderItemId: '31',
      productId: '7',
      productName: '데일리 맨투맨',
      categoryId: '11',
      part: 'TOP',
      size: '110',
      measurements: { TOTAL_LENGTH: 42, CHEST_WIDTH: 34.5 },
      confirmedAt: '2026-11-04T10:00:00',
    })
  })

  it.each([
    ['DRESS', 'DRESS'],
    [null, null],
    ['SHOES', null],
  ])('칸 %s → %s (모르는 칸 이름은 칸 없음으로 둔다)', (part, expected) => {
    expect(
      toPurchasedGarment({
        orderItemId: '33',
        productId: '9',
        productName: '도트 원피스',
        categoryId: '5',
        part,
        size: '110',
        measurements: null,
        confirmedAt: '2026-11-04T10:00:00',
      }).part,
    ).toBe(expected)
  })

  it('상품 정보가 없으면 이름 · 카테고리 · 실측을 비워 둔다 (보호자가 직접 입력)', () => {
    expect(
      toPurchasedGarment({
        orderItemId: '32',
        productId: '8',
        productName: null,
        categoryId: null,
        part: null,
        size: '120',
        measurements: null,
        confirmedAt: '2026-11-03T10:00:00',
      }),
    ).toMatchObject({
      productName: null,
      categoryId: null,
      part: null,
      measurements: null,
      size: '120',
    })
  })
})

describe('산 옷을 채울 수 있는 칸', () => {
  it.each([
    ['TOP', '11', ['TOP']],
    ['OUTER', '14', ['OUTER']],
    ['DRESS', '5', ['DRESS']],
    ['SKIRT', '10', ['SKIRT']],
    [null, '7', []],
    [null, null, ['TOP', 'BOTTOM', 'OUTER', 'DRESS', 'SKIRT']],
  ] as const)(
    '서버 칸 %s · 카테고리 %s → %j (칸이 없으면 기준 옷이 아니고, 상품 정보가 없으면 보호자가 고른다)',
    (part, categoryId, expected) => {
      expect(partsForPurchase({ part, categoryId })).toEqual(expected)
    },
  )
})

describe('고른 산 옷으로 기준 옷 폼 채우기', () => {
  const pants = {
    categoryId: '12',
    part: 'BOTTOM' as const,
    measurements: { TOTAL_LENGTH: 60, WAIST_WIDTH: 25.5, HIP_WIDTH: 33, THIGH_WIDTH: 19 },
  }

  it('그 구분의 실측만 채운다 (엉덩이단면 · 허벅지단면은 빠지고, 없는 선택 실측은 빈칸)', () => {
    expect(toReferenceGarmentFormFromPurchase('BOTTOM', pants)).toEqual({
      categoryId: '12',
      measurements: { TOTAL_LENGTH: '60', WAIST_WIDTH: '25.5', RISE: '' },
    })
  })

  it('치마는 엉덩이단면을 채우고 허벅지단면은 뺀다', () => {
    expect(
      toReferenceGarmentFormFromPurchase('SKIRT', {
        categoryId: '15',
        part: 'SKIRT',
        measurements: { TOTAL_LENGTH: 35, WAIST_WIDTH: 24, HIP_WIDTH: 33, THIGH_WIDTH: 19 },
      }),
    ).toEqual({
      categoryId: '15',
      measurements: { TOTAL_LENGTH: '35', WAIST_WIDTH: '24', HIP_WIDTH: '33' },
    })
  })

  it.each([
    ['실측을 모르면 실측을 비운다', { ...pants, measurements: null }, '12', ''],
    [
      '카테고리를 모르면 세부 종류를 비운다',
      { categoryId: null, part: null, measurements: null },
      '',
      '',
    ],
    ['구분과 맞지 않는 카테고리는 고르지 않는다', { ...pants, part: 'TOP' as const }, '', '60'],
  ])('%s', (_, purchase, categoryId, totalLength) => {
    const form = toReferenceGarmentFormFromPurchase('BOTTOM', purchase)
    expect(form.categoryId).toBe(categoryId)
    expect(form.measurements.TOTAL_LENGTH).toBe(totalLength)
  })
})
