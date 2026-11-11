import type { PurchasedGarmentDto } from '../api/purchased-garment.dto'
import type { PurchasedGarment } from './purchased-garment'
import { GARMENT_PARTS, type GarmentPart } from './reference-garment'

/** 모르는 칸 이름은 칸 없음으로 둔다 */
function toGarmentPart(part: string | null): GarmentPart | null {
  return GARMENT_PARTS.find((item) => item === part) ?? null
}

export function toPurchasedGarment(dto: PurchasedGarmentDto): PurchasedGarment {
  return {
    orderItemId: dto.orderItemId,
    productId: dto.productId,
    productName: dto.productName,
    categoryId: dto.categoryId,
    part: toGarmentPart(dto.part),
    size: dto.size,
    measurements: dto.measurements,
    confirmedAt: dto.confirmedAt,
  }
}
