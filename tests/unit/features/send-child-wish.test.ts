import { describe, expect, it } from 'vitest'
import { sendableWishIds, wishMessageOrNull } from '@/features/send-child-wish'

describe('자녀 조르기 보내기', () => {
  const line = (wishItemId: string, change: { purchasable?: boolean; requestId?: string }) => ({
    wishItemId,
    purchasable: change.purchasable ?? true,
    requestId: change.requestId ?? null,
  })
  it('고른 줄 중 지금 보낼 수 있는 줄만 보낸다', () => {
    const items = [line('1', {}), line('2', { requestId: '9' }), line('3', { purchasable: false })]
    expect(sendableWishIds(items, ['1', '2', '3'])).toEqual(['1'])
    expect(sendableWishIds(items, ['4'])).toEqual([])
  })
  it('빈 메시지는 null로 보내고 나머지는 그대로 보낸다', () => {
    expect(wishMessageOrNull('')).toBeNull()
    expect(wishMessageOrNull('사 주세요')).toBe('사 주세요')
  })
})
