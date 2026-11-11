import type { PurchasedGarmentDto } from '../api/purchased-garment.dto'
import type { PurchasedGarment } from './purchased-garment'

export function toPurchasedGarment(dto: PurchasedGarmentDto): PurchasedGarment {
  return {
    orderItemId: dto.orderItemId,
    productId: dto.productId,
    productName: dto.productName,
    categoryId: dto.categoryId,
    size: dto.size,
    measurements: dto.measurements,
    confirmedAt: dto.confirmedAt,
  }
}
