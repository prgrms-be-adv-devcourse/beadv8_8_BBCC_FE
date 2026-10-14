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

/** GET /children/{childId}/growth-records 한 줄 (백엔드 GrowthRecordResponse) */
export type GrowthRecordDto = {
  id: number
  heightCm: number
  /** 기록 당시 체형. 입력하지 않았으면 null */
  bodyType: string | null
  recordedAt: string
}

/** PATCH /children/{childId}/growth-records/{recordId} (기획서 8장 보완, BE 미구현 → 목) */
export type GrowthRecordUpdateRequestDto = { heightCm: number; bodyType: string | null }
