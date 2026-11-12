import type { ItemJudgementDto, ReferenceFitDto } from '../api/recommendation.dto'
import type { Fit } from './recommendation'
import { GARMENT_PARTS, type GarmentPart } from './reference-garment'
import type { ItemJudgement, ReferenceFit } from './reference-fit'

const isGarmentPart = (part: string): part is GarmentPart =>
  (GARMENT_PARTS as readonly string[]).includes(part)

/** 기준 핏. 칸이 다섯 값 밖이면 이름표를 붙일 수 없어 null */
export function toReferenceFit(dto: ReferenceFitDto | null): ReferenceFit | null {
  if (!dto || !isGarmentPart(dto.productPart) || !isGarmentPart(dto.comparedPart)) return null
  return { productPart: dto.productPart, comparedPart: dto.comparedPart, items: dto.items }
}

export function toItemJudgement(dto: ItemJudgementDto): ItemJudgement {
  return { ...dto, fit: dto.fit as Fit }
}
