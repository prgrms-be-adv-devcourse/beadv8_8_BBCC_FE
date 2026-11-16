import type { HemPosition, SizeWearPreview, SleevePosition, WearSize } from './wear-preview'

const HEM_TEXT: Record<HemPosition, string> = {
  ABOVE_WAIST: '허리 위에서 끝나요 (짧아요)',
  WAIST_HIP: '허리와 엉덩이 사이까지 와요',
  HIP: '엉덩이를 덮어요',
  THIGH: '허벅지까지 내려와요',
  ABOVE_KNEE: '무릎 위에서 끝나요',
  KNEE: '무릎까지 와요',
  BELOW_KNEE: '무릎 아래로 내려와요',
  ANKLE: '발목까지 와요',
  FLOOR: '바닥에 닿아요 (길어요)',
}

const SLEEVE_TEXT: Record<SleevePosition, string> = {
  ELBOW: '팔꿈치 위에서 끝나요 (반팔)',
  ABOVE_WRIST: '손목 위에서 끝나요 (짧아요)',
  WRIST: '손목까지 와요',
  HAND: '손등을 덮어요 (길어요)',
}

/** 밑단 위치 문구 (옷 종류와 상관없이 같다) */
export function hemTextOf(hemAt: HemPosition): string {
  return HEM_TEXT[hemAt]
}

/** 소매 끝 위치 문구 */
export function sleeveTextOf(sleeveAt: SleevePosition): string {
  return SLEEVE_TEXT[sleeveAt]
}

/** 미리볼 수 있는 사이즈: 밑단 위치가 없는 사이즈(총장 없음)는 뺀다 */
export function wearSizesOf(preview: SizeWearPreview): WearSize[] {
  return preview.sizes.filter((item) => item.hemAt !== null)
}

/** 보여 줄 사이즈: 고른 사이즈 → 추천 사이즈 → 첫 사이즈. 미리볼 사이즈가 없으면 null */
export function pickWearSize(
  sizes: WearSize[],
  picked: string | null,
  recommended: string | null,
): WearSize | null {
  const find = (size: string | null) => sizes.find((item) => item.size === size)
  return find(picked) ?? find(recommended) ?? sizes[0] ?? null
}
