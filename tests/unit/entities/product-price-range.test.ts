import { describe, expect, it } from 'vitest'
import { hasPriceRange } from '@/entities/product'

describe('hasPriceRange: 옵션 가격이 서로 다를 때만 가격 뒤에 「~」를 붙인다', () => {
  it.each([
    [[25000, 25000, 25000], false],
    [[25000], false],
    [[], false],
    [[25000, 27000], true],
    [[27000, 25000, 25000], true],
  ])('옵션 가격이 %j이면 가격 범위 여부가 %s다', (prices, expected) => {
    expect(hasPriceRange(prices.map((price) => ({ price })))).toBe(expected)
  })
})
