import { describe, expect, it } from 'vitest'
import { domainOf } from '@/widgets/api-flow-panel/config/domain-flow'

describe('알림함 호출의 도메인', () => {
  it('보호자 · 자녀 알림함 경로는 알림 도메인', () => {
    for (const path of [
      '/notifications?page=0&size=20',
      '/notifications/unread-count',
      '/notifications/7/read',
      '/notifications/read-all',
      '/child/notifications',
      '/child/notifications/read-all',
    ])
      expect(domainOf(path)).toBe('notification')
  })

  it('다른 자녀 경로는 그대로 회원 도메인', () => {
    expect(domainOf('/child/profile')).toBe('member')
  })
})
