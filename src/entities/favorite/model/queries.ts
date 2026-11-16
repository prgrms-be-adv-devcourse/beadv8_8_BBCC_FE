import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { favoriteApi, type FavoriteOwnerPrincipal } from '../api/favorite-api'
import type { FavoriteListDto } from '../api/favorite.dto'
import { toFavoritedIds, toFavoriteItem, toFavoriteSummary } from './favorite.mapper'
import { favoriteIdChunks } from './favorite.rules'

const MY_PAGE_SIZE = 20

export const favoriteKeys = {
  all: ['favorite'] as const,
  summary: (productId: string) => ['favorite', 'summary', productId] as const,
  among: (owner: FavoriteOwnerPrincipal, productIds: string[]) =>
    ['favorite', 'among', owner, productIds.join(',')] as const,
  mine: (owner: FavoriteOwnerPrincipal) => ['favorite', 'mine', owner] as const,
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
  options: { enabled?: boolean; owner?: FavoriteOwnerPrincipal } = {},
) {
  const owner = options.owner ?? 'member'
  const chunks = favoriteIdChunks(productIds)
  return useQuery({
    queryKey: favoriteKeys.among(owner, chunks.flat()),
    queryFn: (): Promise<FavoriteListDto[]> =>
      Promise.all(chunks.map((chunk) => favoriteApi.amongProducts(chunk, owner))),
    select: toFavoritedIds,
    enabled: (options.enabled ?? true) && chunks.length > 0,
  })
}

/** 내 찜(최신순), 「더 보기」로 이어 붙인다. 자녀 화면은 자녀 본인의 찜 */
export function useMyFavoritesQuery(owner: FavoriteOwnerPrincipal = 'member') {
  return useInfiniteQuery({
    queryKey: favoriteKeys.mine(owner),
    queryFn: ({ pageParam }) => favoriteApi.mine({ cursor: pageParam, size: MY_PAGE_SIZE }, owner),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page: FavoriteListDto) => page.nextCursor ?? undefined,
    select: (data) => data.pages.flatMap((page) => page.items.map(toFavoriteItem)),
  })
}
