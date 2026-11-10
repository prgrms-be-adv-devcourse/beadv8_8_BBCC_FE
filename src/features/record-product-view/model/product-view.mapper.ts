import type { ProductViewRequestDto } from '../api/record-product-view.dto'

export function toProductViewRequest(
  productId: string,
  childId: string | null,
): ProductViewRequestDto {
  return childId === null ? { productId } : { productId, childId }
}
