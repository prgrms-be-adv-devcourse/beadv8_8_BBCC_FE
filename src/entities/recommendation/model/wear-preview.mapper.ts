import type { WearPreviewDto } from '../api/wear-preview.dto'
import { GARMENT_PARTS } from './reference-garment'
import { HEM_POSITIONS, SLEEVE_POSITIONS, type SizeWearPreview } from './wear-preview'

/** 목록에 있는 이름만 받는다. 모르는 이름이면 null */
const known = <T extends string>(values: readonly T[], value: string | null): T | null =>
  values.find((item) => item === value) ?? null

/** 사이즈 무관 상품 · 모자 · 양말(null)이나 모르는 옷 종류면 미리보기가 없다 */
export function toWearPreview(dto: WearPreviewDto | null): SizeWearPreview | null {
  const garment = dto && known(GARMENT_PARTS, dto.garment)
  if (!dto || !garment) return null
  return {
    garment,
    body: { ...dto.body },
    sizes: dto.sizes.map((item) => ({
      size: item.size,
      hemCm: item.hemCm,
      hemAt: known(HEM_POSITIONS, item.hemAt),
      sleeveCm: item.sleeveCm,
      sleeveAt: known(SLEEVE_POSITIONS, item.sleeveAt),
    })),
  }
}
