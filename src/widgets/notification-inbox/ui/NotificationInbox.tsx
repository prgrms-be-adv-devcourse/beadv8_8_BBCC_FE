import {
  NotificationItem,
  useNotificationsQuery,
  useUnreadNotificationCountQuery,
  type InboxNotification,
  type NotificationRecipient,
} from '@/entities/notification'
import { useReadAllNotifications, useReadNotification } from '@/features/read-notification'
import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { ListSkeleton } from '@/shared/ui/Skeleton'
import { StateMessage } from '@/shared/ui/StateMessage'

type NotificationInboxProps = { recipient: NotificationRecipient }

/** 알림함 (보호자 · 자녀 같은 모양): 최신순 목록 · 「더 보기」 · 누르면 읽음 · 모두 읽음 */
export function NotificationInbox({ recipient }: NotificationInboxProps) {
  const notifications = useNotificationsQuery(recipient)
  const unreadCount = useUnreadNotificationCountQuery(recipient)
  const read = useReadNotification(recipient)
  const readAll = useReadAllNotifications(recipient)
  const failed = read.error ?? readAll.error

  const handleOpen = (notification: InboxNotification) => {
    if (!notification.isRead) read.mutate(notification.id)
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-page">알림</h1>
        <Button
          variant="outline"
          disabled={!unreadCount.data || readAll.isPending}
          onClick={() => readAll.mutate()}
        >
          모두 읽음
        </Button>
      </div>
      {failed && <StateMessage tone="error">{getErrorMessage(failed)}</StateMessage>}
      {notifications.isPending ? (
        <ListSkeleton rows={3} />
      ) : notifications.isError ? (
        <StateMessage tone="error">{getErrorMessage(notifications.error)}</StateMessage>
      ) : notifications.data.length === 0 ? (
        <div className="bg-paper-2 rounded-card px-4 py-16 text-center">
          <p className="text-ink-2 text-base font-semibold">아직 받은 알림이 없어요.</p>
          <p className="text-ink-3 text-sm">주문 · 배송 소식이 생기면 여기에서 알려 드릴게요.</p>
        </div>
      ) : (
        <>
          <ul className="divide-rule divide-y">
            {notifications.data.map((notification) => (
              <li key={notification.id}>
                <NotificationItem notification={notification} onOpen={handleOpen} />
              </li>
            ))}
          </ul>
          {notifications.hasNextPage && (
            <Button
              variant="outline"
              size="lg"
              disabled={notifications.isFetchingNextPage}
              onClick={() => void notifications.fetchNextPage()}
            >
              알림 더 보기
            </Button>
          )}
        </>
      )}
    </section>
  )
}
