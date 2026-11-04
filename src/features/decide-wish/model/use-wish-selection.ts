import { useState } from 'react'
import { pickShippingAddress, useAddressesQuery } from '@/entities/address'
import type { WishRequest } from '@/entities/wish'

/** 승인할 줄 · 수량 · 배송지 고르기. 배송지는 고르지 않으면 기본 배송지 */
export function useWishSelection(wish: WishRequest) {
  const addresses = useAddressesQuery()
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [addressId, setAddressId] = useState<string | null>(null)
  const address = pickShippingAddress(addresses.data ?? [], addressId)
  const quantityOf = (item: WishRequest['items'][number]) =>
    quantities[item.wishItemId] ?? item.requestedQuantity
  const lines = wish.items
    .filter((item) => selected.has(item.wishItemId))
    .map((item) => ({
      wishItemId: item.wishItemId,
      purchasable: item.purchasable,
      unitPrice: item.unitPrice,
      quantity: quantityOf(item),
    }))
  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const setQuantity = (id: string, quantity: number) =>
    setQuantities((current) => ({ ...current, [id]: quantity }))
  return {
    addresses,
    isSelected: (id: string) => selected.has(id),
    toggle,
    quantityOf,
    setQuantity,
    address,
    selectAddress: setAddressId,
    lines,
  }
}
