import type { MeasurementItemForm } from './catalog'

// 형식은 BE 요청 검증과 같다: 코드는 실측 값의 키라 대문자와 _만
const CODE_PATTERN = /^[A-Z_]+$/

function validateCode(code: string): string | null {
  if (!code.trim()) return '코드를 입력해 주세요.'
  if (!CODE_PATTERN.test(code.trim())) return '코드는 대문자와 _만 쓸 수 있어요.'
  return null
}

export function validateMeasurementItemForm(form: MeasurementItemForm): string | null {
  if (!form.name.trim()) return '실측 항목 이름을 입력해 주세요.'
  const codeError = validateCode(form.code)
  if (codeError) return codeError
  if (!form.unit.trim()) return '단위를 입력해 주세요.'
  return null
}
