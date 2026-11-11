import { describe, expect, it } from 'vitest'
import { referencePartToRegister, type ReferenceGarment } from '@/entities/recommendation'

// 상품 상세 사이즈 추천의 기준 옷 등록 안내: 상품이 기준 옷 구분(상의 · 바지 · 아우터 · 원피스 · 치마)에 들고
// 그 구분의 기준 옷이 아직 없을 때만 권한다. 모자 · 양말 같은 다른 옷과 사이즈 무관 상품에는 권하지 않는다

const top: ReferenceGarment = {
  part: 'TOP',
  categoryId: '11',
  measurements: [{ code: 'TOTAL_LENGTH', label: '총장', value: 45 }],
}

describe('referencePartToRegister', () => {
  it.each([
    ['의류 > 하의 > 바지', 'BOTTOM'],
    ['의류 > 아우터', 'OUTER'],
    ['의류 > 원피스', 'DRESS'],
    ['의류 > 치마', 'SKIRT'],
  ] as const)('기준 옷이 없는 구분(%s)이면 그 구분 %s을 권한다', (path, expected) => {
    expect(referencePartToRegister(path, false, [top])).toBe(expected)
  })

  it.each([
    ['그 구분의 기준 옷이 있으면', '의류 > 상의 > 티셔츠', false],
    ['기준 옷 구분이 아니면 (모자)', '잡화 > 모자', false],
    ['기준 옷 구분이 아니면 (양말)', '잡화 > 양말', false],
    ['사이즈 무관 상품이면', '의류 > 아우터', true],
    ['카테고리를 모르면', null, false],
  ])('%s 권하지 않는다 (null)', (_case, path, isSizeFree) => {
    expect(referencePartToRegister(path, isSizeFree, [top])).toBeNull()
  })
})
