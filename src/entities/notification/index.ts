export type { InboxNotification } from './model/notification'
export { toInboxNotification } from './model/notification.mapper'
export { NOTIFICATION_PATH, type NotificationRecipient } from './api/notification-api'
export {
  notificationKeys,
  useNotificationsQuery,
  useUnreadNotificationCount,
  useUnreadNotificationCountQuery,
} from './model/queries'

// 단위 테스트 입력용 (tests/unit)
export type { InboxNotificationDto as MockInboxNotificationDto } from './api/notification.dto'
export { NotificationItem } from './ui/NotificationItem'
