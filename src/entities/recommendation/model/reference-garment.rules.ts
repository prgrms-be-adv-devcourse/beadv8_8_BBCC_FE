import { GARMENT_PART_SPEC, GARMENT_PARTS, MEASUREMENT_LABEL } from './reference-garment'
import type { GarmentPart, ReferenceGarmentForm } from './reference-garment'

/** 구분의 실측 코드 (필수 → 선택) */
export function measurementCodesOf(part: GarmentPart): string[] {
  const spec = GARMENT_PART_SPEC[part]
  return [...spec.required, ...spec.optional]
}

/** 카테고리 경로(예: 의류 > 상의 > 티셔츠)로 구분을 정한다. 어느 구분도 아니면 null */
export function garmentPartOf(categoryPath: string): GarmentPart | null {
  const names = categoryPath.split('>').map((name) => name.trim())
  return (
    GARMENT_PARTS.find((part) =>
      GARMENT_PART_SPEC[part].categoryNames.some((name) => names.includes(name)),
    ) ?? null
  )
}

/**
 * 산 옷을 채울 수 있는 기준 옷 칸. 카테고리로 구분이 정해지면 그 칸만, 기준 옷이 아닌 옷이면 없음.
 * 상품 정보가 없어 카테고리를 모르면(null) 보호자가 칸을 고른다
 */
export function partsForPurchase(categoryPath: string | null): GarmentPart[] {
  if (categoryPath === null) return [...GARMENT_PARTS]
  const part = garmentPartOf(categoryPath)
  return part ? [part] : []
}

/** 구분에 맞는 카테고리만 (세부 종류 고르기) */
export function categoriesForPart<T extends { path: string }>(
  part: GarmentPart,
  categories: T[],
): T[] {
  return categories.filter((category) => garmentPartOf(category.path) === part)
}

const MEASUREMENT_TEXT = /^\d{1,3}(\.\d)?$/

/** 실측 값 글자: 0 초과 200 이하, 소수 첫째 자리까지 (BE와 같은 조건) */
export function isValidMeasurementText(text: string): boolean {
  const trimmed = text.trim()
  if (!MEASUREMENT_TEXT.test(trimmed)) return false
  const value = Number(trimmed)
  return value > 0 && value <= 200
}

export function validateReferenceGarmentForm(
  part: GarmentPart,
  form: ReferenceGarmentForm,
): string | null {
  if (!form.categoryId) return '세부 종류를 골라 주세요.'
  const text = (code: string) => (form.measurements[code] ?? '').trim()
  const missing = GARMENT_PART_SPEC[part].required.find((code) => !text(code))
  if (missing) return `${MEASUREMENT_LABEL[missing]}은 꼭 입력해 주세요.`
  const invalid = measurementCodesOf(part).some(
    (code) => text(code) && !isValidMeasurementText(text(code)),
  )
  if (invalid) return '실측 값은 0cm보다 크고 200cm 이하로, 소수 첫째 자리까지 입력해 주세요.'
  return null
}
