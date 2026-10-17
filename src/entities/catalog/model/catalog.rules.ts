import type {
  AttributeForm,
  AttributeInputType,
  AttributeValueForm,
  MeasurementItemForm,
} from './catalog'

// 형식은 BE 요청 검증과 같다: 코드는 상품 목록 필터 키라 대문자와 _만, 색 코드는 #rrggbb
const CODE_PATTERN = /^[A-Z_]+$/
const COLOR_CODE_PATTERN = /^#[0-9a-fA-F]{6}$/

/** 목록 값을 갖는 입력 방식인지 (직접 입력은 목록 값이 없다) */
export function hasValueList(inputType: AttributeInputType): boolean {
  return inputType !== 'TEXT'
}

/** 목록 값마다 색 코드를 받는 입력 방식인지 */
export function needsColorCode(inputType: AttributeInputType): boolean {
  return inputType === 'PALETTE'
}

function validateCode(code: string): string | null {
  if (!code.trim()) return '코드를 입력해 주세요.'
  if (!CODE_PATTERN.test(code.trim())) return '코드는 대문자와 _만 쓸 수 있어요.'
  return null
}

export function validateAttributeValueForm(
  value: AttributeValueForm,
  inputType: AttributeInputType,
): string | null {
  if (!value.name.trim()) return '목록 값 이름을 입력해 주세요.'
  if (needsColorCode(inputType) && !COLOR_CODE_PATTERN.test(value.colorCode.trim()))
    return '색 코드는 #rrggbb 형식으로 입력해 주세요.'
  return null
}

function duplicatedValueName(values: AttributeValueForm[]): string | null {
  const seen = new Set<string>()
  for (const value of values) {
    const name = value.name.trim()
    if (seen.has(name)) return name
    seen.add(name)
  }
  return null
}

export function validateAttributeForm(form: AttributeForm): string | null {
  if (!form.name.trim()) return '항목 이름을 입력해 주세요.'
  const codeError = validateCode(form.code)
  if (codeError) return codeError
  if (!hasValueList(form.inputType)) return null
  for (const value of form.values) {
    const valueError = validateAttributeValueForm(value, form.inputType)
    if (valueError) return valueError
  }
  const duplicated = duplicatedValueName(form.values)
  return duplicated === null ? null : `목록 값 이름 「${duplicated}」이 겹쳐요.`
}

export function validateMeasurementItemForm(form: MeasurementItemForm): string | null {
  if (!form.name.trim()) return '실측 항목 이름을 입력해 주세요.'
  const codeError = validateCode(form.code)
  if (codeError) return codeError
  if (!form.unit.trim()) return '단위를 입력해 주세요.'
  return null
}
