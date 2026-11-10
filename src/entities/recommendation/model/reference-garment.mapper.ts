import type { ReferenceGarmentDto, ReferenceGarmentRequestDto } from '../api/reference-garment.dto'
import { MEASUREMENT_LABEL } from './reference-garment'
import type { GarmentPart, ReferenceGarment, ReferenceGarmentForm } from './reference-garment'
import { measurementCodesOf } from './reference-garment.rules'

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
