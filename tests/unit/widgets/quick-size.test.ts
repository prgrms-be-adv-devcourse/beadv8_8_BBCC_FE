import { describe, expect, it } from 'vitest'
import { isQuickSizeWaiting, quickRecommendedSizeOf } from '@/widgets/quick-add'

// 담기 팝업의 사이즈 추천: AI 답이 오거나 스트림이 닫힐 때까지 「추천 계산 중」만 보인다. 상한(5초)을 넘기면 규칙 결과를 그린다.
// 규칙 결과를 먼저 받아도 그리지 않고, 사이즈 버튼의 「추천」 표시도 추천 한 줄과 함께 나타난다

describe('isQuickSizeWaiting: 팝업이 「추천 계산 중」을 보일지', () => {
  it.each([
    // [첫 결과 전, AI 대기 중, 기다린 시간이 상한을 넘음, 기대]
    [true, true, false, true],
    [false, true, false, true],
    [false, false, false, false],
    // 상한을 넘으면 받아 둔 규칙 결과를 그린다. 받은 결과가 없으면 그릴 것이 없어 계속 기다린다
    [false, true, true, false],
    [true, true, true, true],
    [false, false, true, false],
  ])(
    '첫 결과 전 %s · AI 대기 중 %s · 상한 넘음 %s이면 %s다',
    (isLoading, isWaitingForAi, hasWaitedLimit, expected) => {
      expect(isQuickSizeWaiting({ isLoading, isWaitingForAi, hasWaitedLimit })).toBe(expected)
    },
  )
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
