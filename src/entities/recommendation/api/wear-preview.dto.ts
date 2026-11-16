// 사이즈 추천 응답의 착용 미리보기 (BE #1265). 자녀 몸 높이에 사이즈별 밑단 · 소매 위치를 대어 본 값

/** 기준 옷 칸 이름 (TOP · BOTTOM · OUTER · DRESS · SKIRT) */
type WearGarmentDto = string

/** 자녀 몸의 높이(바닥에서 cm, 팔은 길이). 소수 첫째 자리. 목은 목뒤높이다 */
export type WearBodyDto = {
  neckCm: number
  shoulderCm: number
  waistCm: number
  hipCm: number
  crotchCm: number
  kneeCm: number
  ankleCm: number
  armCm: number
}

/**
 * 사이즈 하나의 착용 위치. 총장이 없으면 hemCm · hemAt가, 소매길이가 없거나 바지 · 치마 · 원피스면
 * sleeveCm · sleeveAt가 null이다. hemCm은 반올림한 값이고 바닥 아래로 내려오면 0이다
 */
export type WearSizeDto = {
  size: string
  hemCm: number | null
  /** ABOVE_WAIST · WAIST_HIP · HIP · THIGH · ABOVE_KNEE · KNEE · BELOW_KNEE · ANKLE · FLOOR */
  hemAt: string | null
  sleeveCm: number | null
  /** ELBOW · ABOVE_WRIST · WRIST · HAND */
  sleeveAt: string | null
}

/** 사이즈 무관 상품 · 모자 · 양말이면 응답의 wearPreview가 null이다 */
export type WearPreviewDto = {
  garment: WearGarmentDto
  body: WearBodyDto
  sizes: WearSizeDto[]
}
