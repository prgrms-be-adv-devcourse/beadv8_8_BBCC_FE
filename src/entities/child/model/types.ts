export type Gender = 'MALE' | 'FEMALE'
export type BodyType = 'SLIM' | 'NORMAL' | 'CHUNKY'
export type PreferredFit = 'SLIM' | 'REGULAR' | 'LOOSE'

/** GET /children · /children/{childId} */
export type ChildProfile = {
  id: number
  name: string
  birthDate: string
  gender: Gender
  heightCm: number
  weightKg: number
  bodyType: BodyType | null
  preferredFit: PreferredFit | null
  growthRecordCount: number
  lastRecordedAt: string | null
}

/** 자녀 등록 · 수정 요청 (수정은 전체 교체) */
export type ChildProfileRequest = {
  name: string
  birthDate: string
  gender: Gender
  heightCm: number
  weightKg: number
  bodyType: BodyType | null
  preferredFit: PreferredFit | null
}

export const GENDER_LABEL: Record<Gender, string> = { MALE: '남', FEMALE: '여' }
export const BODY_TYPE_LABEL: Record<BodyType, string> = {
  SLIM: '마름',
  NORMAL: '보통',
  CHUNKY: '통통',
}
export const PREFERRED_FIT_LABEL: Record<PreferredFit, string> = {
  SLIM: '딱 맞게',
  REGULAR: '보통',
  LOOSE: '여유',
}
