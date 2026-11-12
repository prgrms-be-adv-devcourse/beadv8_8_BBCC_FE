import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { favoriteApi } from '../api/favorite-api'
import type { FavoriteListDto } from '../api/favorite.dto'
import { toFavoritedIds, toFavoriteItem, toFavoriteSummary } from './favorite.mapper'
import { favoriteIdChunks } from './favorite.rules'

const MY_PAGE_SIZE = 20

export const favoriteKeys = {
  all: ['favorite'] as const,
  summary: (productId: string) => ['favorite', 'summary', productId] as const,
  among: (productIds: string[]) => ['favorite', 'among', productIds.join(',')] as const,
  mine: ['favorite', 'mine'] as const,
}

/** 상품 찜 수(공개) */
export function useFavoriteSummaryQuery(productId: string) {
  return useQuery({
    queryKey: favoriteKeys.summary(productId),
    queryFn: () => favoriteApi.summary(productId),
    select: toFavoriteSummary,
    enabled: !!productId,
  })
}

/**
 * 주어진 상품 중 내가 찜한 상품 ID 집합 (로그인일 때만). 50개가 넘으면 나눠 부른다.
 * 목록 한 쪽 · 상품 상세 하나에 한 번만 부르도록 상품 ID를 모아서 넘긴다
 */
export function useFavoritedIdsQuery(
  productIds: readonly string[],
  options: { enabled?: boolean } = {},
) {
  const chunks = favoriteIdChunks(productIds)
  return useQuery({
    queryKey: favoriteKeys.among(chunks.flat()),
    queryFn: (): Promise<FavoriteListDto[]> =>
      Promise.all(chunks.map((chunk) => favoriteApi.amongProducts(chunk))),
    select: toFavoritedIds,
    enabled: (options.enabled ?? true) && chunks.length > 0,
  })
}

/** 내 찜(최신순), 「더 보기」로 이어 붙인다 */
export function useMyFavoritesQuery() {
  return useInfiniteQuery({
    queryKey: favoriteKeys.mine,
    queryFn: ({ pageParam }) => favoriteApi.mine({ cursor: pageParam, size: MY_PAGE_SIZE }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page: FavoriteListDto) => page.nextCursor ?? undefined,
    select: (data) => data.pages.flatMap((page) => page.items.map(toFavoriteItem)),
  })
}
