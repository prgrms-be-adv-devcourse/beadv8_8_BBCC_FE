import { describe, expect, it } from 'vitest'
import { toInboxNotification, type MockInboxNotificationDto } from '@/entities/notification'

// BE InboxNotificationResponse (GET /notifications · /child/notifications 목록의 한 건)
const dto: MockInboxNotificationDto = {
  notificationId: 7,
  type: 'ORDER_PAID',
  title: '주문이 결제됐어요',
  body: '아기 바디슈트 외 1건',
  linkPath: '/orders/3',
  read: false,
  createdAt: '2026-11-12T09:30:00',
}

describe('알림함 매퍼', () => {
  it('숫자 ID를 문자열로, read를 isRead로 바꾼다', () => {
    expect(toInboxNotification(dto)).toEqual({
      id: '7',
      type: 'ORDER_PAID',
      title: '주문이 결제됐어요',
      body: '아기 바디슈트 외 1건',
      linkPath: '/orders/3',
      isRead: false,
      createdAt: '2026-11-12T09:30:00',
    })
  })

  it('이동할 곳이 없으면 linkPath는 null', () => {
    expect(toInboxNotification({ ...dto, linkPath: null, read: true })).toMatchObject({
      linkPath: null,
      isRead: true,
    })
  })
})
