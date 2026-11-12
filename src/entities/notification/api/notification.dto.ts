/** BE InboxNotificationResponse. linkPath는 FE 화면 주소(예: /orders/3), 없으면 null */
export type InboxNotificationDto = {
  notificationId: number
  type: string
  title: string
  body: string
  linkPath: string | null
  read: boolean
  createdAt: string
}

/** BE UnreadCountResponse */
export type UnreadCountDto = { count: number }
