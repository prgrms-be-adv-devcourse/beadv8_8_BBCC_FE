import { describe, expect, it } from 'vitest'
import { isQuickSizeWaiting, quickRecommendedSizeOf } from '@/widgets/quick-add'

// 담기 팝업의 사이즈 추천: AI 답이 오거나 스트림이 닫힐 때까지 「추천 계산 중」만 보인다.
// 규칙 결과를 먼저 받아도 그리지 않고, 사이즈 버튼의 「추천」 표시도 추천 한 줄과 함께 나타난다

describe('isQuickSizeWaiting: 팝업이 「추천 계산 중」을 보일지', () => {
  it.each([
    // [첫 결과 전, AI 대기 중, 기대]
    [true, true, true],
    [true, false, true],
    [false, true, true],
    [false, false, false],
  ])('첫 결과 전 %s · AI 대기 중 %s이면 %s다', (isLoading, isWaitingForAi, expected) => {
    expect(isQuickSizeWaiting({ isLoading, isWaitingForAi })).toBe(expected)
  })
})

describe('quickRecommendedSizeOf: 사이즈 버튼에 「추천」을 붙일 사이즈', () => {
  it('기다림이 끝나면 받은 추천 사이즈다', () => {
    expect(quickRecommendedSizeOf({ recommendedSize: '130' }, false)).toBe('130')
  })

  it.each([
    ['기다리는 동안에는 규칙 결과를 받았어도', { recommendedSize: '130' }, true],
    ['받은 추천이 없으면', undefined, false],
    ['맞는 사이즈가 없으면', { recommendedSize: null }, false],
  ])('%s 붙이지 않는다', (_case, recommendation, isWaiting) => {
    expect(quickRecommendedSizeOf(recommendation, isWaiting)).toBeNull()
  })
})
