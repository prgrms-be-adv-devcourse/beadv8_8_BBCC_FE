import { labelOf, toImageUrl } from '@/shared/lib'
import type { ChildPurchaseDto } from '../api/order.dto'

/** 자녀가 보는 나를 위해 산 상품 한 줄 */
export type ChildPurchase = {
  id: string
  orderedAt: string
  productId: string | null
  productName: string
  optionName: string | null
  quantity: number
  /** PAID · SHIPPING · DELIVERED · CONFIRMED · CANCELLED (모르는 값은 그대로) */
  status: string
  /** 주문 당시 상품 사진. 없으면 null */
  thumbnailUrl: string | null
}

export function toChildPurchase(dto: ChildPurchaseDto): ChildPurchase {
  return {
    id: dto.orderItemId,
    orderedAt: dto.orderedAt,
    productId: dto.productId,
    productName: dto.productName || '판매가 끝난 상품',
    optionName: dto.optionName,
    quantity: dto.quantity,
    status: dto.status,
    thumbnailUrl: toImageUrl(dto.thumbnailUrl),
  }
}

const CHILD_PURCHASE_STATUS_LABEL: Record<string, string> = {
  PAID: '결제 완료',
  SHIPPING: '배송 중',
  DELIVERED: '배송 완료',
  CONFIRMED: '구매확정',
  CANCELLED: '취소됨',
}

export function childPurchaseStatusLabel(status: string): string {
  return labelOf(CHILD_PURCHASE_STATUS_LABEL, status)
}

/**
 * 출처: 내 조르기들의 결제된 주문상품(paidOrderItemIds)에 있으면 조르기로 산 것, 없으면 보호자가 산 것.
 * 조르기 반영이 비동기라 결제 직후에는 잠시 보호자가 산 것으로 보일 수 있다 (BE #1000)
 */
export function childPurchaseSourceOf(
  orderItemId: string,
  wishes: { paidOrderItemIds: string[] }[],
): '조르기로 산 것' | '보호자가 산 것' {
  return wishes.some((wish) => wish.paidOrderItemIds.includes(orderItemId))
    ? '조르기로 산 것'
    : '보호자가 산 것'
}
