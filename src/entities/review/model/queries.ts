import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { adminReviewApi } from '../api/admin-review-api'
import { reviewApi } from '../api/review-api'
import type { CursorPageDto } from '../api/review.dto'
import type { ModerationStatus } from './admin-review'
import { toAdminReview } from './admin-review.mapper'
import { toReview, toReviewableItem, toReviewSummary } from './review.mapper'

/** 상품 리뷰 한 번에 부를 개수. 내 리뷰 · 작성 가능 목록은 주문 상세에서 한 번에 확인하도록 최대(50)로 */
const PRODUCT_PAGE_SIZE = 10
const MY_PAGE_SIZE = 50

export const reviewKeys = {
  all: ['review'] as const,
  product: (productId: string) => ['review', 'product', productId] as const,
  summary: (productId: string) => ['review', 'summary', productId] as const,
  mine: ['review', 'mine'] as const,
  reviewable: ['review', 'reviewable'] as const,
  admin: (status: ModerationStatus) => ['review', 'admin', status] as const,
}

const nextCursorOf = (page: CursorPageDto<unknown>) => page.nextCursor ?? undefined

/** 상품 상세 리뷰: 「더 보기」로 다음 쪽을 이어 붙인다 */
export function useProductReviewsQuery(productId: string) {
  return useInfiniteQuery({
    queryKey: reviewKeys.product(productId),
    queryFn: ({ pageParam }) =>
      reviewApi.byProduct(productId, { cursor: pageParam, size: PRODUCT_PAGE_SIZE }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: nextCursorOf,
    select: (data) => data.pages.flatMap((page) => page.items.map(toReview)),
    enabled: !!productId,
  })
}

export function useReviewSummaryQuery(productId: string) {
  return useQuery({
    queryKey: reviewKeys.summary(productId),
    queryFn: () => reviewApi.summary(productId),
    select: toReviewSummary,
    enabled: !!productId,
  })
}

export function useMyReviewsQuery(options: { enabled?: boolean } = {}) {
  return useInfiniteQuery({
    queryKey: reviewKeys.mine,
    queryFn: ({ pageParam }) => reviewApi.mine({ cursor: pageParam, size: MY_PAGE_SIZE }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: nextCursorOf,
    select: (data) => data.pages.flatMap((page) => page.items.map(toReview)),
    enabled: options.enabled ?? true,
  })
}

export function useReviewableItemsQuery(options: { enabled?: boolean } = {}) {
  return useInfiniteQuery({
    queryKey: reviewKeys.reviewable,
    queryFn: ({ pageParam }) => reviewApi.reviewable({ cursor: pageParam, size: MY_PAGE_SIZE }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: nextCursorOf,
    select: (data) => data.pages.flatMap((page) => page.items.map(toReviewableItem)),
    enabled: options.enabled ?? true,
  })
}

/** 작성 가능 목록에서 주문상품 하나. 첫 쪽에 없으면 다음 쪽을 이어서 찾는다 (끝까지 없으면 null) */
export function useReviewableItemQuery(orderItemId: string) {
  const query = useReviewableItemsQuery({ enabled: !!orderItemId })
  const item = query.data?.find((candidate) => candidate.orderItemId === orderItemId) ?? null
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query
  const shouldLoadMore = query.isSuccess && !item && hasNextPage && !isFetchingNextPage
  useEffect(() => {
    if (shouldLoadMore) void fetchNextPage()
  }, [shouldLoadMore, fetchNextPage])
  return {
    item,
    isPending: query.isPending || shouldLoadMore || isFetchingNextPage,
    isError: query.isError,
    error: query.error,
  }
}

/** 관리자 리뷰 검사: 상태별 최신순, 「더 보기」로 이어 붙인다 */
export function useAdminReviewsQuery(status: ModerationStatus) {
  return useInfiniteQuery({
    queryKey: reviewKeys.admin(status),
    queryFn: ({ pageParam }) => adminReviewApi.list(status, { cursor: pageParam, size: 20 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: nextCursorOf,
    select: (data) => data.pages.flatMap((page) => page.items.map(toAdminReview)),
  })
}
