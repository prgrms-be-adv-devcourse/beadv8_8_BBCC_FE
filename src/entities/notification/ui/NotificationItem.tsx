import { Link } from 'react-router'
import { cn, formatDateTime } from '@/shared/lib'
import type { InboxNotification } from '../model/notification'

type NotificationItemProps = {
  notification: InboxNotification
  /** 누를 때 (읽음 처리). 이동할 화면이 있으면 이동도 함께 한다 */
  onOpen: (notification: InboxNotification) => void
}

/** 알림 한 건. 안 읽은 알림은 점과 굵은 제목으로 표시한다 */
export function NotificationItem({ notification, onOpen }: NotificationItemProps) {
  const { title, body, createdAt, linkPath, isRead } = notification
  const content = (
    <>
      <span
        aria-hidden
        className={cn('mt-1.5 size-2 shrink-0 rounded-full', !isRead && 'bg-signal')}
      />
      <span className="min-w-0 flex-1 space-y-1">
        <span className={cn('block', isRead ? 'text-ink-2' : 'text-ink font-semibold')}>
          {title}
          {!isRead && <span className="sr-only"> (안 읽음)</span>}
        </span>
        <span className="text-ink-2 block text-sm">{body}</span>
        <span className="text-ink-3 block text-xs">{formatDateTime(createdAt)}</span>
      </span>
    </>
  )
  const className = 'hover:bg-paper-2 flex w-full gap-3 px-2 py-4 text-left'
  return linkPath ? (
    <Link to={linkPath} className={className} onClick={() => onOpen(notification)}>
      {content}
    </Link>
  ) : (
    <button type="button" className={className} onClick={() => onOpen(notification)}>
      {content}
    </button>
  )
}
