import { bool, nullable, num, obj, pageOf, str } from '@/shared/api'

export const inboxNotificationShape = obj({
  notificationId: num,
  type: str,
  title: str,
  body: str,
  linkPath: nullable(str),
  read: bool,
  createdAt: str,
})
export const inboxNotificationPageShape = pageOf(inboxNotificationShape)
export const unreadCountShape = obj({ count: num })
