import { WebPushBanner } from '@/features/subscribe-web-push'
import { NotificationInbox } from '@/widgets/notification-inbox'

export function ShopNotificationsPage() {
  return (
    <div className="shop-look space-y-4">
      <WebPushBanner />
      <NotificationInbox recipient="member" />
    </div>
  )
}
