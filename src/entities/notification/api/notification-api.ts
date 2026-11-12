import { apiClient, expectShape, openEventStream, type Page } from '@/shared/api'
import type { InboxNotificationDto, UnreadCountDto } from './notification.dto'
import { inboxNotificationPageShape, unreadCountShape } from './notification.shape'

/** 받는 사람. 보호자(회원)와 자녀는 경로만 다르고 응답 · 규칙이 같다 (BE InboxNotificationController · ChildInboxNotificationController) */
export type NotificationRecipient = 'member' | 'child'

/** 자녀 경로(/child/…)는 공통 클라이언트가 자녀 토큰을 붙인다 */
export const NOTIFICATION_PATH: Record<NotificationRecipient, string> = {
  member: '/notifications',
  child: '/child/notifications',
}

const PAGE_SIZE = 20

export const notificationApi = {
  /** 최신순. page는 0부터 */
  list: (recipient: NotificationRecipient, page: number) =>
    apiClient
      .get<Page<InboxNotificationDto>>(NOTIFICATION_PATH[recipient], {
        params: { page, size: PAGE_SIZE },
      })
      .then(expectShape(inboxNotificationPageShape)),
  unreadCount: (recipient: NotificationRecipient) =>
    apiClient
      .get<UnreadCountDto>(`${NOTIFICATION_PATH[recipient]}/unread-count`)
      .then(expectShape(unreadCountShape)),
  /** 안 읽은 수 SSE. 연결하면 지금 수를, 바뀌면 새 수를 unread-count 이벤트로 받는다. 서버가 30분 뒤 닫으면 끝난다 */
  unreadCountStream: (
    recipient: NotificationRecipient,
    signal: AbortSignal,
    onCount: (dto: UnreadCountDto) => void,
  ) =>
    openEventStream<UnreadCountDto>(`${NOTIFICATION_PATH[recipient]}/stream`, {
      signal,
      shape: unreadCountShape,
      onEvent: (item) => {
        if (item.event === 'unread-count') onCount(item.data)
      },
    }),
}
