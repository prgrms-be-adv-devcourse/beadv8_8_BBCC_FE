import { describe, expect, it } from 'vitest'
import { validateChildForm, type ChildForm } from '@/entities/child'
import { toSellerApplicationRequest, validateSellerApplicationForm } from '@/entities/seller'
import { DEMO_APPLICATION } from '@/features/apply-seller'

const TODAY = '2026-10-15'
const child = (patch: Partial<ChildForm> = {}): ChildForm => ({
  name: '테스트',
  birthDate: '2019-01-01',
  gender: 'MALE',
  heightCm: 115,
  weightKg: 20,
  bodyType: null,
  preferredFit: null,
  ...patch,
})

describe('자녀 입력 검증 (서버 규칙과 같음)', () => {
  it('정상 입력은 통과한다', () => {
    expect(validateChildForm(child(), TODAY)).toBeNull()
  })
  it('키는 40.0 ~ 200.0cm (경계 포함)', () => {
    expect(validateChildForm(child({ heightCm: 40 }), TODAY)).toBeNull()
    expect(validateChildForm(child({ heightCm: 200 }), TODAY)).toBeNull()
    expect(validateChildForm(child({ heightCm: 39.9 }), TODAY)).not.toBeNull()
    expect(validateChildForm(child({ heightCm: 200.1 }), TODAY)).not.toBeNull()
  })
  it('몸무게는 2.0 ~ 150.0kg (경계 포함)', () => {
    expect(validateChildForm(child({ weightKg: 2 }), TODAY)).toBeNull()
    expect(validateChildForm(child({ weightKg: 150 }), TODAY)).toBeNull()
    expect(validateChildForm(child({ weightKg: 1.9 }), TODAY)).not.toBeNull()
    expect(validateChildForm(child({ weightKg: 150.1 }), TODAY)).not.toBeNull()
  })
  it('소수 첫째 자리까지만 받는다', () => {
    expect(validateChildForm(child({ heightCm: 116.4 }), TODAY)).toBeNull()
    expect(validateChildForm(child({ heightCm: 116.45 }), TODAY)).not.toBeNull()
  })
  it('생년월일은 오늘까지 (경계)', () => {
    expect(validateChildForm(child({ birthDate: TODAY }), TODAY)).toBeNull()
    expect(validateChildForm(child({ birthDate: '2026-10-16' }), TODAY)).not.toBeNull()
  })
  it('이름은 비면 안 되고 50자까지 (경계)', () => {
    expect(validateChildForm(child({ name: '  ' }), TODAY)).not.toBeNull()
    expect(validateChildForm(child({ name: 'a'.repeat(50) }), TODAY)).toBeNull()
    expect(validateChildForm(child({ name: 'a'.repeat(51) }), TODAY)).not.toBeNull()
  })
})

describe('판매자 신청 검증', () => {
  const base = {
    businessName: '테스트상점',
    representativeName: '홍길동',
    businessRegistrationNumber: '1234567890',
  }
  it('사업자등록번호는 하이픈 없는 숫자 10자리', () => {
    expect(validateSellerApplicationForm(base)).toBeNull()
    expect(
      validateSellerApplicationForm({ ...base, businessRegistrationNumber: '123456789' }),
    ).not.toBeNull()
    expect(
      validateSellerApplicationForm({ ...base, businessRegistrationNumber: '12345678901' }),
    ).not.toBeNull()
    expect(
      validateSellerApplicationForm({ ...base, businessRegistrationNumber: '123-45-67890' }),
    ).not.toBeNull()
  })
})

describe('시연 판매자 신청 값 (자동 시연 · 신청 화면이 같이 씀)', () => {
  it('신청 검증(BE: 사업자등록번호 하이픈 없는 숫자 10자리)을 통과한다', () => {
    expect(validateSellerApplicationForm(DEMO_APPLICATION)).toBeNull()
    expect(toSellerApplicationRequest(DEMO_APPLICATION).businessRegistrationNumber).toMatch(
      /^\d{10}$/,
    )
  })
})
