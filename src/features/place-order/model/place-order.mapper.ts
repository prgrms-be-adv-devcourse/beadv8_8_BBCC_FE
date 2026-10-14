import type { ShippingAddress } from '@/entities/address'
import type { CartLine } from '@/entities/cart'
import type { PlaceOrderInput } from '@/entities/order'

/** 장바구니 줄 + 고른 배송지 → 주문하기 입력. 화면이 본 단가를 그대로 보낸다 (다르면 서버가 409) */
export function toPlaceOrderInput(lines: CartLine[], address: ShippingAddress): PlaceOrderInput {
  return {
    items: lines.map((line) => ({
      optionId: line.optionId,
      childId: line.childId,
      quantity: line.quantity,
      unitPrice: line.unitPrice ?? 0,
    })),
    shippingAddress: {
      recipientName: address.recipientName,
      phone: address.phone,
      zipCode: address.zipCode,
      address: address.fullAddress,
    },
  }
}
