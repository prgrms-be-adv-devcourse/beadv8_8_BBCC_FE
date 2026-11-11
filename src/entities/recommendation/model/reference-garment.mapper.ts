import type { ReferenceGarmentDto, ReferenceGarmentRequestDto } from '../api/reference-garment.dto'
import { MEASUREMENT_LABEL } from './reference-garment'
import type { GarmentPart, ReferenceGarment, ReferenceGarmentForm } from './reference-garment'
import { garmentPartOf, measurementCodesOf } from './reference-garment.rules'

export function toReferenceGarment(dto: ReferenceGarmentDto): ReferenceGarment {
  const part = dto.part as GarmentPart
  return {
    part,
    categoryId: dto.categoryId,
    measurements: measurementCodesOf(part)
      .filter((code) => dto.measurements[code] !== undefined)
      .map((code) => ({ code, label: MEASUREMENT_LABEL[code], value: dto.measurements[code] })),
  }
}

/** 저장한 기준 옷으로 채운 폼. 없으면 빈 폼. 구분의 실측 칸은 모두 둔다 */
export function toReferenceGarmentForm(
  part: GarmentPart,
  garment: ReferenceGarment | null,
): ReferenceGarmentForm {
  const values = new Map(garment?.measurements.map((item) => [item.code, String(item.value)]))
  return {
    categoryId: garment?.categoryId ?? '',
    measurements: Object.fromEntries(
      measurementCodesOf(part).map((code) => [code, values.get(code) ?? '']),
    ),
  }
}

/** 입력한 실측만 숫자로 싣는다 (빈 선택 실측은 빠지고, 저장하면 사라진다) */
export function toReferenceGarmentRequest(form: ReferenceGarmentForm): ReferenceGarmentRequestDto {
  const measurements = Object.fromEntries(
    Object.entries(form.measurements)
      .map(([code, text]) => [code, text.trim()] as const)
      .filter(([, text]) => text !== '')
      .map(([code, text]) => [code, Number(text)]),
  )
  return { categoryId: form.categoryId, measurements }
}

/** 고른 산 옷: 말단 카테고리(경로)와 산 사이즈의 실측(항목 코드 → cm). 모르면 null */
export type PurchaseSource = {
  categoryId: string | null
  categoryPath: string | null
  measurements: Record<string, number> | null
}

/**
 * 고른 산 옷으로 기준 옷 폼을 채운다. 그 구분의 실측만 채우고(다른 코드는 빠짐) 모르는 실측은 빈칸.
 * 카테고리를 모르거나 구분과 맞지 않으면 세부 종류를 비워 보호자가 고르게 한다
 */
export function toReferenceGarmentFormFromPurchase(
  part: GarmentPart,
  purchase: PurchaseSource,
): ReferenceGarmentForm {
  const isSamePart = purchase.categoryPath !== null && garmentPartOf(purchase.categoryPath) === part
  const values = purchase.measurements ?? {}
  return {
    categoryId: isSamePart ? (purchase.categoryId ?? '') : '',
    measurements: Object.fromEntries(
      measurementCodesOf(part).map((code) => [
        code,
        values[code] === undefined ? '' : String(values[code]),
      ]),
    ),
  }
}

/** 산 상품: 상품의 말단 카테고리(경로)와 사이즈별 실측(항목 코드 → cm) */
export type PurchasedProduct = {
  categoryId: string
  categoryPath: string
  sizeSpecs: { size: string; measurements: { code: string; value: number | null }[] }[]
}

/**
 * 산 상품의 카테고리로 구분을 정하고, 산 사이즈의 실측 중 그 구분의 항목만 폼에 채운다.
 * 기준 옷 구분이 아니거나 그 사이즈 실측이 없으면 null
 */
export function toReferenceGarmentFromPurchase(
  purchase: PurchasedProduct,
  size: string,
): { part: GarmentPart; form: ReferenceGarmentForm } | null {
  const part = garmentPartOf(purchase.categoryPath)
  const spec = purchase.sizeSpecs.find((item) => item.size === size)
  if (!part || !spec) return null
  const measurements = Object.fromEntries(
    spec.measurements.flatMap((item) => (item.value === null ? [] : [[item.code, item.value]])),
  )
  return {
    part,
    form: toReferenceGarmentFormFromPurchase(part, {
      categoryId: purchase.categoryId,
      categoryPath: purchase.categoryPath,
      measurements,
    }),
  }
}
