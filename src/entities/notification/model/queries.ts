import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { nextPageOf } from '@/shared/api'
import { notificationApi, type NotificationRecipient } from '../api/notification-api'
import { toInboxNotification } from './notification.mapper'

/**
 * 안 읽은 수를 다시 묻는 간격. BE에 알림 스트림(SSE)이 없어 주기 조회로 맞춘다 (탭이 숨으면 멈춤: 기본값).
 * 60초는 GitHub Notifications API의 기본 polling 주기(X-Poll-Interval)
 */
const UNREAD_REFETCH_MS = 60_000

export const notificationKeys = {
  all: (recipient: NotificationRecipient) => ['notification', recipient] as const,
  list: (recipient: NotificationRecipient) => ['notification', recipient, 'list'] as const,
  unreadCount: (recipient: NotificationRecipient) =>
    ['notification', recipient, 'unread-count'] as const,
}

/** 알림함: 「더 보기」로 다음 쪽을 이어 붙인다 */
export function useNotificationsQuery(recipient: NotificationRecipient) {
  return useInfiniteQuery({
    queryKey: notificationKeys.list(recipient),
    queryFn: ({ pageParam }) => notificationApi.list(recipient, pageParam),
    initialPageParam: 0,
    getNextPageParam: nextPageOf,
    select: (data) => data.pages.flatMap((page) => page.content.map(toInboxNotification)),
  })
}

/** 안 읽은 수. 알림함과 쇼핑 · 자녀 레이아웃(로그인했을 때만, enabled)이 부른다 */
export function useUnreadNotificationCountQuery(recipient: NotificationRecipient, enabled = true) {
  return useQuery({
    queryKey: notificationKeys.unreadCount(recipient),
    enabled,
    queryFn: () => notificationApi.unreadCount(recipient),
    select: (dto) => dto.count,
    refetchInterval: UNREAD_REFETCH_MS,
    refetchOnWindowFocus: true,
  })
}

/**
 * 머리말 배지. 쇼핑 레이아웃이 불러 둔 안 읽은 수만 읽고 직접 부르지 않는다
 * (머리말은 API를 부르지 않는다 — 흐름 기록에 화면 동작만 남기려고)
 */
export function useUnreadNotificationCount(): number | null {
  const query = useQuery({
    queryKey: notificationKeys.unreadCount('member'),
    queryFn: () => notificationApi.unreadCount('member'),
    select: (dto) => dto.count,
    enabled: false,
  })
  return query.data ?? null
}
