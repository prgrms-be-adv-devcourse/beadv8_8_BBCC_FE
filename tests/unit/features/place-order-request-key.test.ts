import { describe, expect, it } from 'vitest'
import { createRequestKeyHolder } from '@/features/place-order/model/request-key'
import { newRequestKey } from '@/shared/lib'

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

describe('주문 멱등키 (BE #351)', () => {
  it('newRequestKey: UUID v4 · 매번 다름', () => {
    const a = newRequestKey()
    expect(a).toMatch(UUID_V4)
    expect(newRequestKey()).not.toBe(a)
  })
  it('같은 내용으로 다시 보내면 같은 키 (재시도 → 주문 하나)', () => {
    let n = 0
    const holder = createRequestKeyHolder(() => `key-${++n}`)
    expect(holder.keyFor({ items: [1], address: 'a' })).toBe('key-1')
    expect(holder.keyFor({ items: [1], address: 'a' })).toBe('key-1')
  })
  it('내용이 바뀌면 새 키, reset 뒤에도 새 키', () => {
    let n = 0
    const holder = createRequestKeyHolder(() => `key-${++n}`)
    holder.keyFor({ quantity: 1 })
    expect(holder.keyFor({ quantity: 2 })).toBe('key-2')
    holder.reset()
    expect(holder.keyFor({ quantity: 2 })).toBe('key-3')
  })
})
