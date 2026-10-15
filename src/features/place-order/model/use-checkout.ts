import { useState } from 'react'
import { pickShippingAddress, useAddressesQuery } from '@/entities/address'
import { orderableLines, sumLineAmount, useCartQuery } from '@/entities/cart'
import { shortageOf, useWalletQuery } from '@/entities/wallet'

/**
 * 주문서: 장바구니 · 배송지 · 잔액을 모아 주문할 줄 · 금액 · 고른 배송지 · 부족 금액을 낸다.
 * 콘솔 · 쇼핑 장바구니가 같이 쓴다 (규칙은 각 엔티티)
 */
export function useCheckout() {
  const cart = useCartQuery()
  const addresses = useAddressesQuery()
  const wallet = useWalletQuery()
  const [addressId, setAddressId] = useState<string | null>(null)

  const lines = cart.data ? orderableLines(cart.data) : []
  const orderAmount = sumLineAmount(lines)
  return {
    cart,
    addresses,
    wallet,
    lines,
    orderAmount,
    address: pickShippingAddress(addresses.data ?? [], addressId),
    selectAddress: setAddressId,
    shortage: shortageOf(wallet.data?.balance, orderAmount),
  }
}
