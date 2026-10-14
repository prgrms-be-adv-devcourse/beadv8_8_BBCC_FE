export type Gender = 'MALE' | 'FEMALE'
export type BodyType = 'SLIM' | 'NORMAL' | 'CHUNKY'
export type PreferredFit = 'SLIM' | 'REGULAR' | 'LOOSE'

export type Child = {
  id: string
  name: string
  birthDate: string
  gender: Gender
  heightCm: number
  weightKg: number
  bodyType: BodyType | null
  preferredFit: PreferredFit | null
  growthRecordCount: number
}

/** 자녀 입력 폼 값 */
export type ChildForm = {
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

/** 성장 이력 1건 (키 · 체형이 바뀔 때마다 쌓임) */
export type GrowthRecord = {
  id: string
  heightCm: number
  bodyType: BodyType | null
  recordedAt: string
}

export type GrowthSummary = {
  count: number
  /** 처음 기록 → 마지막 기록 키 변화 (0.1cm). 기록이 2건 미만이면 null */
  heightChangeCm: number | null
  latest: GrowthRecord | null
}
