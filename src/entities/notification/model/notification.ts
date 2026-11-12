export type InboxNotification = {
  id: string
  type: string
  title: string
  body: string
  /** 누르면 갈 화면 주소. 없으면 null */
  linkPath: string | null
  isRead: boolean
  createdAt: string
}
