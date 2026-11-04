import type { ApproveWishRequestDto } from '../api/decision.dto'

type ApprovalLine = {
  wishItemId: string
  quantity: number
  unitPrice: number | null
  purchasable: boolean
}
type ApprovalAddress = {
  recipientName: string
  phone: string
  zipCode: string
  fullAddress: string
}

/** 바로 결제할 수 있는 줄: 판매 중이고 지금 가격을 아는 줄 */
export function isApprovableLine(line: { purchasable: boolean; unitPrice: number | null }) {
  return line.purchasable && line.unitPrice !== null
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
        line.quantity <= 99,
    )
  )
}

export function toWishApproval(
  lines: ApprovalLine[],
  address: ApprovalAddress,
): ApproveWishRequestDto {
  return {
    checkout: 'ORDER',
    items: lines.map((line) => ({
      wishItemId: Number(line.wishItemId),
      quantity: line.quantity,
      unitPrice: line.unitPrice,
    })),
    shippingAddress: {
      recipientName: address.recipientName,
      phone: address.phone,
      zipCode: address.zipCode,
      address: address.fullAddress,
    },
  }
}
