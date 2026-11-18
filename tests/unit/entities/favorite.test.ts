import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it } from 'vitest'
import {
  canQuickAddFavorite,
  canToggleFavorite,
  FAVORITE_DISPLAY_STATUS_LABEL,
  favoriteIdChunks,
  isDeletedChildAccountError,
  favoriteStampOf,
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

describe('내 찜 목록의 사진 도장 · 바로 담기', () => {
  it.each([
    ['SOLD_OUT', '품절'],
    ['SALE_ENDED', '판매 종료'],
    ['ON_SALE', null],
    [null, null],
  ] as const)(
    '표시 상태 %s의 도장은 %s (판매 중 · 상태 모름은 찍지 않는다)',
    (status, expected) => {
      expect(favoriteStampOf(status)).toBe(expected)
    },
  )

  it.each([
    ['ON_SALE', true],
    ['SOLD_OUT', false],
    ['SALE_ENDED', false],
    [null, false],
  ] as const)('표시 상태 %s는 바로 담기 가능 여부가 %s다', (status, expected) => {
    expect(canQuickAddFavorite(status)).toBe(expected)
  })
})

describe('isDeletedChildAccountError: 지운 자녀 계정의 찜 요청 (BE 403 FAVORITE_CHILD_ACCOUNT_DELETED)', () => {
  function withStatus(status: number) {
    const config = { headers: new AxiosHeaders() }
    return new AxiosError('error', 'ERR', config, null, {
      status,
      statusText: '',
      headers: {},
      config,
      data: {
        type: 'about:blank',
        title: 't',
        status,
        detail: '삭제된 자녀 계정입니다',
        instance: '/',
      },
    })
  }
  it('자녀 화면의 403만 true (보호자 403 · 자녀 다른 오류는 false)', () => {
    expect(isDeletedChildAccountError(withStatus(403), 'child')).toBe(true)
    expect(isDeletedChildAccountError(withStatus(403), 'member')).toBe(false)
    expect(isDeletedChildAccountError(withStatus(409), 'child')).toBe(false)
    expect(isDeletedChildAccountError(new Error('x'), 'child')).toBe(false)
  })
})
