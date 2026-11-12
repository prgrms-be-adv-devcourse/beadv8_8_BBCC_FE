import type { PlaceOrderInput } from '@/entities/order'

type ApprovalLine = {
  /** 예약된 장바구니 칸 */
  cartItemId: string | null
  optionId: string
  /** 주문할 수량 */
  quantity: number
  /** 보낸 수량 = 예약 칸 수량. 이보다 많이 주문하면 409 (BE RESERVED_QUANTITY_EXCEEDED) */
  maxQuantity: number
  unitPrice: number | null
  purchasable: boolean
}
type ApprovalAddress = {
  recipientName: string
  phone: string
  zipCode: string
  fullAddress: string
}

/** 바로 결제할 수 있는 줄: 칸이 있고 판매 중이며 지금 가격을 아는 줄 */
export function isApprovableLine(line: {
  cartItemId: string | null
  purchasable: boolean
  unitPrice: number | null
}) {
  return line.cartItemId !== null && line.purchasable && line.unitPrice !== null
}

/** 승인할 줄: 바로 결제할 수 있는 줄 전부에서 보호자가 뺀 줄(excluded)만 빠진다 (처음부터 모두 고른 상태) */
export function approvedOptionIds(
  items: {
    optionId: string
    cartItemId: string | null
    purchasable: boolean
    unitPrice: number | null
  }[],
  excluded: string[],
): string[] {
  return items
    .filter((item) => isApprovableLine(item) && !excluded.includes(item.optionId))
    .map((item) => item.optionId)
}

/** 결제할 금액: 단가 × 주문 수량의 합 */
export function wishOrderTotal(lines: { unitPrice: number | null; quantity: number }[]): number {
  return lines.reduce((sum, line) => sum + (line.unitPrice ?? 0) * line.quantity, 0)
}

export function canApproveWish(lines: ApprovalLine[], address: ApprovalAddress | null): boolean {
  return (
    !!address &&
    lines.length > 0 &&
    lines.every(
      (line) =>
        isApprovableLine(line) &&
        Number.isInteger(line.quantity) &&
        line.quantity >= 1 &&
        line.quantity <= line.maxQuantity,
    )
  )
}

/** 승인 = 예약 칸으로 주문하기. 입을 아이는 조르기를 받는 자녀(칸의 자녀와 같아야 함) */
export function toWishOrder(
  childId: string,
  lines: ApprovalLine[],
  address: ApprovalAddress,
): PlaceOrderInput {
  return {
    items: lines.map((line) => ({
      optionId: line.optionId,
      childId,
      quantity: line.quantity,
      unitPrice: line.unitPrice ?? 0,
      cartItemId: line.cartItemId ?? undefined,
    })),
    shippingAddress: {
      recipientName: address.recipientName,
      phone: address.phone,
      zipCode: address.zipCode,
      address: address.fullAddress,
    },
  }
}
