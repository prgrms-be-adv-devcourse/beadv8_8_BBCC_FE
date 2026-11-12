import { describe, expect, it } from 'vitest'
import {
  canToggleFavorite,
  FAVORITE_DISPLAY_STATUS_LABEL,
  favoriteIdChunks,
  toFavoriteItem,
  toFavoriteSummary,
  toFavoritedIds,
} from '@/entities/favorite'

describe('toFavoriteItem: 내 찜 항목 (BE FavoriteListResponse.Item)', () => {
  it('ID는 문자열, 표시 상태는 아는 값만 두고 모르는 값 · null은 null로', () => {
    const base = {
      productId: '31',
      productName: '기모 맨투맨',
      thumbnailUrl: null,
      favoritedAt: '2026-11-12T10:00:00',
    }
    expect(toFavoriteItem({ ...base, displayStatus: 'SOLD_OUT' })).toEqual({
      productId: '31',
      productName: '기모 맨투맨',
      thumbnailUrl: null,
      displayStatus: 'SOLD_OUT',
      favoritedAt: '2026-11-12T10:00:00',
    })
    expect(toFavoriteItem({ ...base, displayStatus: 'WHATEVER' }).displayStatus).toBeNull()
    expect(toFavoriteItem({ ...base, displayStatus: null }).displayStatus).toBeNull()
  })

  it('표시 상태 라벨: 판매 중 · 품절 · 판매 종료', () => {
    expect(FAVORITE_DISPLAY_STATUS_LABEL).toEqual({
      ON_SALE: '판매 중',
      SOLD_OUT: '품절',
      SALE_ENDED: '판매 종료',
    })
  })
})

describe('찜 수 · 찜한 상품 ID', () => {
  it('요약은 찜 수를 그대로', () => {
    expect(toFavoriteSummary({ productId: '31', favoriteCount: 12 })).toEqual({
      productId: '31',
      count: 12,
    })
  })

  it('productIds 필터 응답 여러 쪽을 찜한 ID 집합으로', () => {
    const ids = toFavoritedIds([
      {
        items: [
          {
            productId: '1',
            productName: null,
            thumbnailUrl: null,
            displayStatus: null,
            favoritedAt: 'x',
          },
        ],
        nextCursor: null,
      },
      {
        items: [
          {
            productId: '7',
            productName: null,
            thumbnailUrl: null,
            displayStatus: null,
            favoritedAt: 'x',
          },
        ],
        nextCursor: null,
      },
    ])
    expect([...ids].sort()).toEqual(['1', '7'])
  })
})

describe('favoriteIdChunks: GET /favorites?productIds= 는 한 번에 1~50개', () => {
  it('중복을 빼고 정렬해 50개씩 나눈다', () => {
    const ids = Array.from({ length: 101 }, (_, i) => String(i + 1))
    const chunks = favoriteIdChunks([...ids, '1', '2'])
    expect(chunks.map((chunk) => chunk.length)).toEqual([50, 50, 1])
    expect(chunks.flat()).toHaveLength(101)
  })

  it('없으면 빈 목록 (요청하지 않음)', () => {
    expect(favoriteIdChunks([])).toEqual([])
  })

  it('정렬해서 같은 ID 묶음이면 순서가 달라도 같은 결과', () => {
    expect(favoriteIdChunks(['3', '10', '2'])).toEqual(favoriteIdChunks(['10', '2', '3']))
  })
})

describe('canToggleFavorite: 판매 중이 아닌 상품은 찜할 수 없다 (409), 이미 찜한 것은 뺄 수 있다', () => {
  it.each([
    [{ isFavorited: false, isSelling: true }, true],
    [{ isFavorited: false, isSelling: false }, false],
    [{ isFavorited: true, isSelling: false }, true],
    [{ isFavorited: true, isSelling: true }, true],
  ])('%o → %s', (input, expected) => {
    expect(canToggleFavorite(input)).toBe(expected)
  })
})
