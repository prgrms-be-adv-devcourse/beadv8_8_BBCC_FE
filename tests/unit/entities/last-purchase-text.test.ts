import { describe, expect, it } from 'vitest'
import { lastPurchaseTextOf } from '@/entities/recommendation'

// 사이즈 추천 상자의 지난 구매 줄 (BE #1299): 같은 기준 옷 칸에서 12개월 안에 마지막으로 구매확정한 사이즈.
// 사이즈 이름마다 을/를이 달라지지 않게 「사이즈를」로 고정한다. 없으면 줄을 숨긴다

describe('lastPurchaseTextOf', () => {
  it.each([
    ['120', '지난번 같은 종류는 120 사이즈를 샀어요'],
    ['95', '지난번 같은 종류는 95 사이즈를 샀어요'],
    ['S', '지난번 같은 종류는 S 사이즈를 샀어요'],
  ])('지난 구매 사이즈 %s: %s', (lastPurchasedSize, text) => {
    expect(lastPurchaseTextOf({ lastPurchasedSize })).toBe(text)
  })

  it.each([null, '', '  '])('지난 구매 사이즈가 %j면 숨긴다 (null)', (lastPurchasedSize) => {
    expect(lastPurchaseTextOf({ lastPurchasedSize })).toBeNull()
  })
})
