/** GET /children 한 줄 (백엔드 ChildProfileResponse). BigDecimal은 숫자로 온다 */
export type ChildProfileDto = {
  id: number
  name: string
  birthDate: string
  gender: string
  heightCm: number
  weightKg: number
  bodyType: string | null
  preferredFit: string | null
  growthRecordCount: number
  lastRecordedAt: string | null
}

/** 자녀 등록 · 수정 요청 (수정은 전체 교체) */
export type ChildProfileRequestDto = {
  name: string
  birthDate: string
  gender: string
  heightCm: number
  weightKg: number
  bodyType: string | null
  preferredFit: string | null
}
