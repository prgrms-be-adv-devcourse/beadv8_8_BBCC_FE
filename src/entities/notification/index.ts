export type { InboxNotification } from './model/notification'
export { toInboxNotification } from './model/notification.mapper'
export { NOTIFICATION_PATH, type NotificationRecipient } from './api/notification-api'
export {
  notificationKeys,
  useNotificationsQuery,
  useUnreadNotificationCount,
  useUnreadNotificationCountQuery,
  useUnreadCountStream,
} from './model/queries'

// 목 응답 작성 전용
export type { InboxNotificationDto as MockInboxNotificationDto } from './api/notification.dto'
export { NotificationItem } from './ui/NotificationItem'
