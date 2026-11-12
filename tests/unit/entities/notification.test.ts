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

// BE가 보내는 linkPath (notification 도메인의 *InboxService · NotificationService)
describe('알림 이동 주소', () => {
  const linkOf = (linkPath: string) => toInboxNotification({ ...dto, linkPath }).linkPath

  it('FE에 있는 주소는 그대로 이동한다', () => {
    expect(linkOf('/orders/3')).toBe('/orders/3')
    expect(linkOf('/center/settlements/5')).toBe('/center/settlements/5')
    expect(linkOf('/my/children/1/wishes/2')).toBe('/my/children/1/wishes/2')
  })

  it('FE에 없는 자녀 조르기 상세는 조르기 목록으로 바꾼다', () => {
    expect(linkOf('/child/wishes/9')).toBe('/child/wishes')
  })

  it('모르는 주소는 이동하지 않는다 (null → 읽음 처리만)', () => {
    expect(linkOf('/unknown/1')).toBeNull()
  })
})
