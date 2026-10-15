import { useState } from 'react'
import { pickShippingAddress, useAddressesQuery } from '@/entities/address'
import {
  isAllSelected,
  orderableLines,
  selectedLines,
  sumLineAmount,
  useCartQuery,
} from '@/entities/cart'
import { shortageOf, suggestChargeAmount, useWalletQuery } from '@/entities/wallet'

/**
 * 주문서: 장바구니 · 배송지 · 잔액을 모아 주문할 줄 · 금액 · 고른 배송지 · 부족 금액을 낸다.
 * 콘솔 · 쇼핑 장바구니가 같이 쓴다 (규칙은 각 엔티티)
 */
export function useCheckout() {
  const cart = useCartQuery()
  const addresses = useAddressesQuery()
  const wallet = useWalletQuery()
  const [addressId, setAddressId] = useState<string | null>(null)
  // 선택을 뺀 줄만 기억한다 → 새로 담은 줄은 선택된 채로 시작
  const [excluded, setExcluded] = useState<ReadonlySet<string>>(new Set())

  const lines = cart.data ? selectedLines(cart.data, excluded) : []
  const orderAmount = sumLineAmount(lines)
  const shortage = shortageOf(wallet.data?.balance, orderAmount)

  const toggleLine = (lineId: string) =>
    setExcluded((current) => {
      const next = new Set(current)
      if (next.has(lineId)) next.delete(lineId)
      else next.add(lineId)
      return next
    })
  const allSelected = cart.data ? isAllSelected(cart.data, excluded) : false
  const toggleAll = () =>
    setExcluded(
      allSelected && cart.data
        ? new Set(orderableLines(cart.data).map((line) => line.id))
        : new Set(),
    )

  return {
    cart,
    addresses,
    wallet,
    lines,
    orderAmount,
    address: pickShippingAddress(addresses.data ?? [], addressId),
    selectAddress: setAddressId,
    shortage,
    /** 부족한 만큼 충전할 금액 (부족하지 않으면 null) */
    chargeAmount: suggestChargeAmount(shortage),
    isSelected: (lineId: string) => !excluded.has(lineId),
    toggleLine,
    allSelected,
    toggleAll,
  }
}
