import { describe, expect, it } from 'vitest'
import { validateMeasurementItemForm } from '@/entities/catalog'

// 관리자 상품 기준 데이터 입력 검증. 형식은 BE 요청 검증(@Pattern)과 같게 맞춘다

describe('validateMeasurementItemForm: 실측 항목 만들기 폼', () => {
  const form = { name: '총장', code: 'TOTAL_LENGTH', unit: 'cm' }

  it.each(['TOTAL_LENGTH', '_', 'A', ' RISE '])('코드 %j는 통과한다', (code) => {
    expect(validateMeasurementItemForm({ ...form, code })).toBeNull()
  })

  it.each(['total_length', 'LENGTH1', 'TOTAL-LENGTH', 'TOTAL LENGTH', '총장'])(
    '코드 %j는 대문자와 _만 쓰라고 거절한다',
    (code) => {
      expect(validateMeasurementItemForm({ ...form, code })).toBe(
        '코드는 대문자와 _만 쓸 수 있어요.',
      )
    },
  )

  it.each([
    [{ name: '' }, '실측 항목 이름을 입력해 주세요.'],
    [{ code: ' ' }, '코드를 입력해 주세요.'],
    [{ unit: '' }, '단위를 입력해 주세요.'],
  ])('필수값 %o이 비면 거절한다', (patch, message) => {
    expect(validateMeasurementItemForm({ ...form, ...patch })).toBe(message)
  })
})
