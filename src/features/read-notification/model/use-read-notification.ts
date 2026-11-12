import { useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationKeys, type NotificationRecipient } from '@/entities/notification'
import { runWithAction } from '@/shared/api'
import { readNotificationApi } from '../api/read-notification-api'

/** 목록과 안 읽은 수를 함께 다시 부른다 */
function useInvalidateNotifications(recipient: NotificationRecipient) {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: notificationKeys.all(recipient) })
}

export function useReadNotification(recipient: NotificationRecipient) {
  const onSuccess = useInvalidateNotifications(recipient)
  return useMutation({
    mutationFn: (id: string) =>
      runWithAction('알림 읽음', () => readNotificationApi.read(recipient, id)),
    onSuccess,
  })
}

export function useReadAllNotifications(recipient: NotificationRecipient) {
  const onSuccess = useInvalidateNotifications(recipient)
  return useMutation({
    mutationFn: () => runWithAction('알림 모두 읽음', () => readNotificationApi.readAll(recipient)),
    onSuccess,
  })
}
