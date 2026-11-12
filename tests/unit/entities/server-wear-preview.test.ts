import { describe, expect, it } from 'vitest'
import {
  hemTextOf,
  pickWearSize,
  sleeveTextOf,
  toWearPreview,
  wearSizesOf,
  type WearPreviewDto,
  type WearSize,
} from '@/entities/recommendation'

// 착용 미리보기 (BE #1265): 서버가 자녀 몸 높이와 사이즈별 밑단 · 소매 위치를 준다.
// 화면은 위치를 cm로 다시 계산하지 않고 hemAt · sleeveAt로 문구를 정하며, cm는 그림에만 쓴다

const body = {
  neckCm: 107.3,
  shoulderCm: 101.1,
  waistCm: 78,
  hipCm: 64.2,
  crotchCm: 58.5,
  kneeCm: 33.5,
  ankleCm: 5.7,
  armCm: 43,
}

const outer: WearPreviewDto = {
  garment: 'OUTER',
  body,
  sizes: [
    { size: '100', hemCm: 65.3, hemAt: 'WAIST_HIP', sleeveCm: 36, sleeveAt: 'ABOVE_WRIST' },
    { size: '110', hemCm: null, hemAt: null, sleeveCm: null, sleeveAt: null },
    { size: '120', hemCm: 59.3, hemAt: 'HIP', sleeveCm: 42, sleeveAt: 'WRIST' },
  ],
}

describe('착용 미리보기 변환', () => {
  it('사이즈 무관 상품 · 모자 · 양말(null)은 미리보기가 없다', () => {
    expect(toWearPreview(null)).toBeNull()
  })

  it('옷 종류 · 몸 높이 · 사이즈별 밑단 · 소매를 그대로 옮긴다', () => {
    expect(toWearPreview(outer)).toEqual({
      garment: 'OUTER',
      body,
      sizes: [
        { size: '100', hemCm: 65.3, hemAt: 'WAIST_HIP', sleeveCm: 36, sleeveAt: 'ABOVE_WRIST' },
        { size: '110', hemCm: null, hemAt: null, sleeveCm: null, sleeveAt: null },
        { size: '120', hemCm: 59.3, hemAt: 'HIP', sleeveCm: 42, sleeveAt: 'WRIST' },
      ],
    })
  })

  it('모르는 밑단 · 소매 위치 이름은 위치 없음(null)으로 둔다', () => {
    const preview = toWearPreview({
      ...outer,
      sizes: [{ size: '100', hemCm: 60, hemAt: 'SHIN', sleeveCm: 40, sleeveAt: 'FINGER' }],
    })
    expect(preview?.sizes[0]).toMatchObject({ hemAt: null, sleeveAt: null })
  })

  it('모르는 옷 종류면 그릴 수 없어 미리보기가 없다', () => {
    expect(toWearPreview({ ...outer, garment: 'HAT' })).toBeNull()
  })
})

describe('미리볼 사이즈', () => {
  it('밑단 위치가 없는 사이즈(총장 없음)는 미리보기 칩에서 뺀다', () => {
    expect(wearSizesOf(toWearPreview(outer)!).map((item) => item.size)).toEqual(['100', '120'])
  })

  const sizes = [{ size: '100' }, { size: '120' }] as WearSize[]

  it.each([
    ['120', '100', '120'],
    [null, '120', '120'],
    [null, '130', '100'],
    ['130', null, '100'],
    [null, null, '100'],
  ])(
    '고른 사이즈 %s · 추천 사이즈 %s → %s (고른 것 → 추천 → 첫 사이즈)',
    (picked, recommended, expected) => {
      expect(pickWearSize(sizes, picked, recommended)?.size).toBe(expected)
    },
  )

  it('미리볼 사이즈가 없으면 고르지 않는다', () => {
    expect(pickWearSize([], '100', '100')).toBeNull()
  })
})

describe('착용 위치 문구', () => {
  it.each([
    ['ABOVE_WAIST', '허리 위에서 끝나요 (짧아요)'],
    ['WAIST_HIP', '허리와 엉덩이 사이까지 와요'],
    ['HIP', '엉덩이를 덮어요'],
    ['THIGH', '허벅지까지 내려와요'],
    ['ABOVE_KNEE', '무릎 위에서 끝나요'],
    ['KNEE', '무릎까지 와요'],
    ['BELOW_KNEE', '무릎 아래로 내려와요'],
    ['ANKLE', '발목까지 와요'],
    ['FLOOR', '바닥에 닿아요 (길어요)'],
  ] as const)('밑단 %s → %s', (hemAt, expected) => {
    expect(hemTextOf(hemAt)).toBe(expected)
  })

  it.each([
    ['ELBOW', '팔꿈치 위에서 끝나요 (반팔)'],
    ['ABOVE_WRIST', '손목 위에서 끝나요 (짧아요)'],
    ['WRIST', '손목까지 와요'],
    ['HAND', '손등을 덮어요 (길어요)'],
  ] as const)('소매 %s → %s', (sleeveAt, expected) => {
    expect(sleeveTextOf(sleeveAt)).toBe(expected)
  })
})
