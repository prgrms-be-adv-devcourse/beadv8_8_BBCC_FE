import type { InboxNotificationDto } from '../api/notification.dto'
import type { InboxNotification } from './notification'

export function toInboxNotification(dto: InboxNotificationDto): InboxNotification {
  return {
    id: String(dto.notificationId),
    type: dto.type,
    title: dto.title,
    body: dto.body,
    linkPath: dto.linkPath,
    isRead: dto.read,
    createdAt: dto.createdAt,
  }
}
