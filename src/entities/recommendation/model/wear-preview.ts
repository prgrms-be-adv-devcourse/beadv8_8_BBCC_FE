import type { GarmentPart } from './reference-garment'

export const HEM_POSITIONS = [
  'ABOVE_WAIST',
  'WAIST_HIP',
  'HIP',
  'THIGH',
  'ABOVE_KNEE',
  'KNEE',
  'BELOW_KNEE',
  'ANKLE',
  'FLOOR',
] as const
export const SLEEVE_POSITIONS = ['ELBOW', 'ABOVE_WRIST', 'WRIST', 'HAND'] as const

/** 밑단이 몸의 어디에서 끝나는지 (서버가 정한다) */
export type HemPosition = (typeof HEM_POSITIONS)[number]
/** 소매 끝이 팔의 어디에서 끝나는지 (서버가 정한다) */
export type SleevePosition = (typeof SLEEVE_POSITIONS)[number]

/** 자녀 몸의 높이(바닥에서 cm, 팔은 길이). 그림을 그리는 데만 쓴다 */
export type WearBody = {
  neckCm: number
  shoulderCm: number
  waistCm: number
  hipCm: number
  crotchCm: number
  kneeCm: number
  ankleCm: number
  armCm: number
}

/** 사이즈 하나의 착용 위치. 문구는 위치(hemAt · sleeveAt)로, 그림은 cm로 그린다. 모르면 null */
export type WearSize = {
  size: string
  hemCm: number | null
  hemAt: HemPosition | null
  sleeveCm: number | null
  sleeveAt: SleevePosition | null
}

/** 착용 미리보기: 옷 종류(기준 옷 칸) · 자녀 몸 높이 · 사이즈별 착용 위치 */
export type SizeWearPreview = {
  garment: GarmentPart
  body: WearBody
  sizes: WearSize[]
}
