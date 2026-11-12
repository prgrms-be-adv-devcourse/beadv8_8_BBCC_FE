import { useState } from 'react'
import type { CartLine } from '@/entities/cart'
import { selectedWishIds } from './child-wish.rules'

/**
 * 보낼 줄 고르기: 처음부터 보낼 수 있는 줄은 모두 고른 상태, 사용자가 뺀 줄만 빠진다.
 * 잠기거나 판매가 끝난 줄은 처음부터 빠진다
 */
export function useChildWishSelection(items: CartLine[]) {
  const [excluded, setExcluded] = useState<string[]>([])
  const ids = selectedWishIds(items, excluded)
  const sendable = selectedWishIds(items, [])
  const toggle = (id: string) =>
    setExcluded((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    )
  const toggleAll = () => setExcluded(ids.length === sendable.length ? sendable : [])
  return {
    ids,
    isSelected: (id: string) => ids.includes(id),
    isAllSelected: sendable.length > 0 && ids.length === sendable.length,
    sendableCount: sendable.length,
    toggle,
    toggleAll,
    clear: () => setExcluded([]),
  }
}
