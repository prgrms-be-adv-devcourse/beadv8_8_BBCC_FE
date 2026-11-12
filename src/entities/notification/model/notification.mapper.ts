import { matchPath } from 'react-router'
import { paths } from '@/shared/config'
import type { InboxNotificationDto } from '../api/notification.dto'
import type { InboxNotification } from './notification'

/** BE가 보내는 linkPath 중 FE에 그대로 있는 화면 */
const FE_LINKS = [
  paths.shop.orders,
  paths.shop.order(':id'),
  paths.shop.childWish(':childId', ':requestId'),
  paths.center.home,
  paths.center.product(':id'),
  paths.center.settlement(':id'),
  paths.child.wishes,
]

/** FE에 있는 주소는 그대로, 자녀 조르기 상세(FE에 없음)는 목록으로, 그 밖은 이동 없음(null) */
function toFeLinkPath(linkPath: string | null): string | null {
  if (!linkPath) return null
  if (FE_LINKS.some((pattern) => matchPath(pattern, linkPath))) return linkPath
  if (matchPath(`${paths.child.wishes}/:requestId`, linkPath)) return paths.child.wishes
  return null
}

export function toInboxNotification(dto: InboxNotificationDto): InboxNotification {
  return {
    id: String(dto.notificationId),
    type: dto.type,
    title: dto.title,
    body: dto.body,
    linkPath: toFeLinkPath(dto.linkPath),
    isRead: dto.read,
    createdAt: dto.createdAt,
  }
}
