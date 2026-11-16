import { toImageUrl } from '@/shared/lib'
import type { AddCartItemRequestDto, CartDto } from '../api/cart.dto'
import type { Cart } from './cart'

/** 상품 정보가 없는 줄(판매가 끝나 복사본이 없음)의 상품명 */
const ENDED_PRODUCT_NAME = '판매가 끝난 상품'

export function toCart(dto: CartDto): Cart {
  return {
    lines: dto.items.map((item) => ({
      id: item.cartItemId,
      optionId: item.optionId,
      productId: item.productId,
      sellerId: item.sellerId ?? null,
      sellerName: item.sellerName?.trim() || null,
      productName: item.productName ?? ENDED_PRODUCT_NAME,
      optionName: item.optionName ?? null,
      size: item.size,
      childId: item.childId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      purchasable: item.purchasable,
      lineAmount: item.lineAmount,
      reserved: item.reserved,
      thumbnailUrl: toImageUrl(item.thumbnailUrl),
    })),
    totalAmount: dto.totalAmount,
  }
}

export function toAddCartItemRequest(item: {
  optionId: string
  childId: string | null
  quantity: number
}): AddCartItemRequestDto {
  return {
    optionId: Number(item.optionId),
    childId: item.childId === null ? null : Number(item.childId),
    quantity: item.quantity,
  }
}
