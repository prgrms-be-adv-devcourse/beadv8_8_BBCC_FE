import { describe, expect, it } from 'vitest'
import { fitWithin } from '@/shared/lib'

describe('fitWithin: 긴 변을 기준 길이 안으로 줄인 크기', () => {
  it.each([
    [
      { width: 2000, height: 1500 },
      { width: 2000, height: 1500 },
    ],
    [
      { width: 1500, height: 2000 },
      { width: 1500, height: 2000 },
    ],
    [
      { width: 640, height: 480 },
      { width: 640, height: 480 },
    ],
  ])('긴 변이 2000px 이하인 %o는 그대로 %o', (size, expected) => {
    expect(fitWithin(size, 2000)).toEqual(expected)
  })

  it.each([
    [
      { width: 2001, height: 1000 },
      { width: 2000, height: 1000 },
    ],
    [
      { width: 4032, height: 3024 },
      { width: 2000, height: 1500 },
    ],
    [
      { width: 3024, height: 4032 },
      { width: 1500, height: 2000 },
    ],
    [
      { width: 3000, height: 1 },
      { width: 2000, height: 1 },
    ],
  ])('긴 변이 2000px보다 큰 %o는 비율을 지켜 %o로 줄인다', (size, expected) => {
    expect(fitWithin(size, 2000)).toEqual(expected)
  })
})
