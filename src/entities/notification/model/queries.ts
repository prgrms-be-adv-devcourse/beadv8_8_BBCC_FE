import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { getErrorStatus, nextPageOf } from '@/shared/api'
import { notificationApi, type NotificationRecipient } from '../api/notification-api'
import { toInboxNotification } from './notification.mapper'

/**
 * 안 읽은 수를 다시 묻는 간격. 알림 스트림(SSE)이 끊겼거나 열리지 않을 때만 쓴다 (탭이 숨으면 멈춤: 기본값).
 * 60초는 GitHub Notifications API의 기본 polling 주기(X-Poll-Interval)
 */
const UNREAD_REFETCH_MS = 60_000
/** 스트림이 끊기면 1초부터 2배씩, 최대 30초 기다렸다 다시 연결한다 (지수 백오프) */
const RETRY_MIN_MS = 1_000
const RETRY_MAX_MS = 30_000

/** 스트림으로 안 읽은 수를 받고 있는 받는 사람. 이 동안은 주기 조회를 멈춘다 */
const streaming = new Set<NotificationRecipient>()

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
    // 캐시가 바뀔 때마다 다시 정한다: 스트림이 수를 넣으면 멈추고, 끊겨 다시 조회하면 돌아온다
    refetchInterval: () => (streaming.has(recipient) ? false : UNREAD_REFETCH_MS),
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

/**
 * 안 읽은 수 SSE를 열어 두고, 받은 수를 캐시에 바로 넣는다 (이벤트에 수가 있어 다시 조회하지 않는다).
 * 끊기면 한 번 다시 조회해 주기 조회로 돌아가고, 지수 백오프로 다시 연결한다.
 * 401은 공통 클라이언트가 재발급 뒤 다시 보낸다. 그래도 4xx(BE 미배포 404 등)면 다시 연결하지 않고 주기 조회만 쓴다 (EventSource 표준과 같다).
 * accessToken이 바뀌면(역할 전환 · 로그아웃) 그 연결을 끊고 새로 연다. null이면 열지 않는다
 */
export function useUnreadCountStream(recipient: NotificationRecipient, accessToken: string | null) {
  const queryClient = useQueryClient()
  useEffect(() => {
    if (!accessToken) return
    const queryKey = notificationKeys.unreadCount(recipient)
    const controller = new AbortController()
    let retryMs = RETRY_MIN_MS
    let timer: ReturnType<typeof setTimeout> | undefined
    const connect = () =>
      notificationApi
        .unreadCountStream(recipient, controller.signal, (dto) => {
          streaming.add(recipient)
          retryMs = RETRY_MIN_MS
          queryClient.setQueryData(queryKey, dto)
        })
        .then(
          () => null,
          (error: unknown) => getErrorStatus(error),
        )
        .then((status) => {
          if (controller.signal.aborted) return
          if (streaming.delete(recipient)) void queryClient.invalidateQueries({ queryKey })
          if (status !== null && status < 500) return
          timer = setTimeout(connect, retryMs)
          retryMs = Math.min(retryMs * 2, RETRY_MAX_MS)
        })
    void connect()
    return () => {
      controller.abort()
      clearTimeout(timer)
      streaming.delete(recipient)
    }
  }, [queryClient, recipient, accessToken])
}
