import { describe, expect, it } from 'vitest'
import { nextPageOf, pageNumbersOf } from '@/shared/api'

describe('nextPageOf: 「더 보기」로 부를 다음 페이지 (hasNext 기준, page는 0부터)', () => {
  it.each([
    [{ page: 0, hasNext: true }, 1],
    [{ page: 3, hasNext: true }, 4],
    [{ page: 3, hasNext: false }, undefined],
  ])('%j → %s', (page, expected) => {
    expect(nextPageOf(page)).toBe(expected)
  })
})

describe('pageNumbersOf: 페이지 번호 줄 (지금 페이지를 가운데에 두고 최대 5개, page는 0부터)', () => {
  it.each([
    [0, 1, [0]],
    [0, 3, [0, 1, 2]],
    [0, 10, [0, 1, 2, 3, 4]],
    [5, 10, [3, 4, 5, 6, 7]],
    [9, 10, [5, 6, 7, 8, 9]],
    [8, 10, [5, 6, 7, 8, 9]],
    [0, 0, []],
  ])('지금 %i · 전체 %i페이지 → %j', (page, totalPages, expected) => {
    expect(pageNumbersOf(page, totalPages)).toEqual(expected)
  })
})
