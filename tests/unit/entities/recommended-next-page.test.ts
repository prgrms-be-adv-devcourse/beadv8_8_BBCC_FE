import { describe, expect, it } from 'vitest'
import { nextRecommendedPageOf } from '@/entities/recommendation'

// 맞춤 목록 「더 보기」: 2쪽부터는 1쪽 응답의 기준 시각 asOf를 그대로 넘겨, 쪽 사이 순서가 바뀌지 않게 한다
describe('nextRecommendedPageOf: 다음 쪽 요청 값', () => {
  const asOf = '2026-11-11T10:20:30'

  it.each([
    [0, 1],
    [3, 4],
  ])('%i쪽 다음이 있으면 %i쪽을 같은 asOf로 부른다', (page, next) => {
    expect(nextRecommendedPageOf({ page, hasNext: true, asOf })).toEqual({ page: next, asOf })
  })

  it('다음 쪽이 없으면 더 부르지 않는다', () => {
    expect(nextRecommendedPageOf({ page: 1, hasNext: false, asOf })).toBeUndefined()
  })
})
