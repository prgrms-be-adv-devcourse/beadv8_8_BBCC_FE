import type { AddCartItemRequestDto, CartDto } from '../api/cart.dto'
import type { Cart } from './cart'

export function toCart(dto: CartDto): Cart {
  return {
    lines: dto.items.map((item) => ({
      id: item.cartItemId,
      optionId: item.optionId,
      productId: item.productId,
      sellerId: item.sellerId ?? null,
      productName: item.productName,
      optionName: item.optionName ?? null,
      size: item.size,
      childId: item.childId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      purchasable: item.purchasable,
      lineAmount: item.lineAmount,
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
