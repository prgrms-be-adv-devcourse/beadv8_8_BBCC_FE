import { useState } from 'react'
import { pickShippingAddress, useAddressesQuery } from '@/entities/address'
import { useWalletQuery } from '@/entities/wallet'
import type { WishRequest } from '@/entities/wish'
import { approvedOptionIds } from './approval'

/**
 * 승인할 줄 · 수량 · 배송지 고르기 (줄은 옵션으로 구분). 결제할 수 있는 줄은 처음부터 모두 고른 상태,
 * 배송지는 고르지 않으면 기본 배송지
 */
export function useWishSelection(wish: WishRequest) {
  const addresses = useAddressesQuery()
  const wallet = useWalletQuery()
  const [excluded, setExcluded] = useState<string[]>([])
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [addressId, setAddressId] = useState<string | null>(null)
  const address = pickShippingAddress(addresses.data ?? [], addressId)
  const quantityOf = (item: WishRequest['items'][number]) =>
    quantities[item.optionId] ?? item.quantity
  const selectedIds = approvedOptionIds(wish.items, excluded)
  const approvable = approvedOptionIds(wish.items, [])
  const lines = wish.items
    .filter((item) => selectedIds.includes(item.optionId))
    .map((item) => ({
      cartItemId: item.cartItemId,
      optionId: item.optionId,
      purchasable: item.purchasable,
      unitPrice: item.unitPrice,
      quantity: quantityOf(item),
      maxQuantity: item.quantity,
    }))
  const toggle = (id: string) =>
    setExcluded((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    )
  const isAllSelected = approvable.length > 0 && selectedIds.length === approvable.length
  const toggleAll = () => setExcluded(isAllSelected ? approvable : [])
  const setQuantity = (id: string, quantity: number) =>
    setQuantities((current) => ({ ...current, [id]: quantity }))
  return {
    addresses,
    /** 지금 예치금 (결제 뒤 잔액 미리 보기). 못 읽으면 null */
    balance: wallet.data?.balance ?? null,
    isSelected: (id: string) => selectedIds.includes(id),
    isAllSelected,
    approvableCount: approvable.length,
    toggle,
    toggleAll,
    quantityOf,
    setQuantity,
    address,
    selectAddress: setAddressId,
    lines,
  }
}
