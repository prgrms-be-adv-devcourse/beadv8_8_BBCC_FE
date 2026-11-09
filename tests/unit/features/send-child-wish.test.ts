import { describe, expect, it } from 'vitest'
import { sendableWishIds, toChildWishRequest, wishMessageOrNull } from '@/features/send-child-wish'

describe('자녀 조르기 보내기', () => {
  const line = (id: string, change: { purchasable?: boolean; reserved?: boolean }) => ({
    id,
    purchasable: change.purchasable ?? true,
    reserved: change.reserved ?? false,
  })
  it('고른 칸 중 지금 보낼 수 있는 칸만 보낸다', () => {
    const items = [line('1', {}), line('2', { reserved: true }), line('3', { purchasable: false })]
    expect(sendableWishIds(items, ['1', '2', '3'])).toEqual(['1'])
    expect(sendableWishIds(items, ['4'])).toEqual([])
  })
  it('빈 메시지는 null로 보내고 나머지는 그대로 보낸다', () => {
    expect(wishMessageOrNull('')).toBeNull()
    expect(wishMessageOrNull('사 주세요')).toBe('사 주세요')
  })
  it('장바구니 칸 ID를 숫자로 보낸다 (BE SendWishRequest)', () => {
    expect(toChildWishRequest(['30', '31'], '')).toEqual({ cartItemIds: [30, 31], message: null })
  })
})
