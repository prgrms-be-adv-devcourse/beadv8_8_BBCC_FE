import { NOTIFICATION_PATH, type NotificationRecipient } from '@/entities/notification'
import { apiClient } from '@/shared/api'

/** 둘 다 204. 이미 읽었거나 안 읽은 알림이 없어도 204 */
export const readNotificationApi = {
  read: (recipient: NotificationRecipient, id: string) =>
    apiClient.patch(`${NOTIFICATION_PATH[recipient]}/${id}/read`).then(() => undefined),
  readAll: (recipient: NotificationRecipient) =>
    apiClient.patch(`${NOTIFICATION_PATH[recipient]}/read-all`).then(() => undefined),
}
