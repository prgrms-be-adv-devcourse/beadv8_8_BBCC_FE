import { useState } from 'react'
import type { WishLine } from '@/entities/wish'
import { sendableWishIds } from './child-wish.rules'

/** 보낼 줄 고르기. 잠기거나 판매가 끝난 줄은 골라 둔 것이어도 빠진다 */
export function useChildWishSelection(items: WishLine[]) {
  const [selected, setSelected] = useState<string[]>([])
  const ids = sendableWishIds(items, selected)
  const toggle = (id: string) =>
    setSelected(ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id])
  return { ids, isSelected: (id: string) => ids.includes(id), toggle, clear: () => setSelected([]) }
}
