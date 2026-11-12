import { NotificationInbox } from '@/widgets/notification-inbox'

export function ShopNotificationsPage() {
  return (
    <div className="shop-look">
      <NotificationInbox recipient="member" />
    </div>
  )
}
