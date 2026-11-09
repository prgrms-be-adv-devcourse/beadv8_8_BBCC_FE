import type { ChildForm } from '@/entities/child'

/** 기획서 7.1 시연 자녀 1 */
export const DEMO_CHILD: ChildForm = {
  name: '테스트',
  birthDate: '2019-01-01',
  gender: 'MALE',
  heightCm: 115.0,
  weightKg: 20.0,
  bodyType: 'NORMAL',
  preferredFit: 'LOOSE',
}

/** 빈 자녀 폼 (시연 기능이 꺼진 운영). 키 · 몸무게 0은 검증에서 걸린다 */
export const EMPTY_CHILD: ChildForm = {
  name: '',
  birthDate: '',
  gender: 'MALE',
  heightCm: 0,
  weightKg: 0,
  bodyType: null,
  preferredFit: null,
}
