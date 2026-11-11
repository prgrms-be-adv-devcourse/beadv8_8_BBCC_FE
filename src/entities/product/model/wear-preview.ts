import type { SizeSpec } from './product'

/**
 * 착용 미리보기: 아동 평균 신체 비율(키 대비)로 옷 길이가 몸 어디까지 오는지 본다.
 * 길이 비교용 근삿값이라 화면에 "평균 비율로 그린 그림"이라고 적는다
 */
export const BODY = {
  /** 목옆점(상의 총장을 재는 곳) */
  neck: 0.81,
  /** 어깨 끝 */
  shoulder: 0.79,
  waist: 0.6,
  hip: 0.5,
  crotch: 0.46,
  knee: 0.27,
  ankle: 0.045,
  /** 어깨 끝 → 손목 길이 */
  arm: 0.35,
} as const

export type GarmentKind = 'top' | 'bottom' | 'dress' | 'skirt'

/** 무릎 높이로 볼 범위 (±cm) */
const KNEE_RANGE = 3

export type WearFit = {
  /** 밑단(상의 · 원피스 · 치마) · 바지 끝(하의) 위치, 바닥에서 cm */
  hemCm: number
  hem: string
  /** 상의 · 원피스: 소매 끝 */
  sleeve: string | null
  sleeveCm: number | null
}

const valueOf = (spec: SizeSpec, name: string) =>
  spec.measurements.find((item) => item.name.includes(name) && item.value !== null)?.value ?? null

/**
 * 옷 종류: 상품 카테고리(말단 이름)가 원피스 · 치마면 그대로, 아니면 실측 이름으로 상의 · 하의를 가른다
 * (실측만 보면 원피스는 가슴 때문에 상의, 치마는 허리 때문에 하의로 보인다). 총장이 없으면 그릴 수 없다
 */
export function garmentKindOf(
  spec: SizeSpec,
  categoryName: string | null = null,
): GarmentKind | null {
  if (valueOf(spec, '총장') === null) return null
  if (categoryName === '원피스') return 'dress'
  if (categoryName === '치마') return 'skirt'
  if (spec.measurements.some((item) => /소매|어깨|가슴/.test(item.name))) return 'top'
  if (spec.measurements.some((item) => /허리|밑위|허벅지|인심/.test(item.name))) return 'bottom'
  return null
}

/** 밑단이 무릎보다 몇 cm 위인지 (소수 오차 없이 0.1cm 단위) */
const aboveKnee = (hemCm: number, heightCm: number) =>
  Math.round((hemCm - BODY.knee * heightCm) * 10) / 10

/** 원피스: 목옆점에서 총장만큼. 무릎 위 · 무릎까지(±3cm) · 무릎 아래 */
function dressHemOf(hemCm: number, heightCm: number): string {
  const gap = aboveKnee(hemCm, heightCm)
  if (gap > KNEE_RANGE) return '무릎 위에서 끝나요'
  if (gap >= -KNEE_RANGE) return '무릎까지 와요'
  return '무릎 아래로 내려와요'
}

export function wearFitOf(
  spec: SizeSpec,
  heightCm: number,
  categoryName: string | null = null,
): WearFit | null {
  const kind = garmentKindOf(spec, categoryName)
  const length = valueOf(spec, '총장')
  if (!kind || length === null) return null
  const at = (ratio: number) => ratio * heightCm
  if (kind === 'skirt') {
    // 치마: 허리에서 총장만큼. 무릎보다 3cm 넘게 위면 무릎 위, 그 밖은 무릎을 덮는다
    const hemCm = at(BODY.waist) - length
    const hem = aboveKnee(hemCm, heightCm) > KNEE_RANGE ? '무릎 위에서 끝나요' : '무릎을 덮어요'
    return { hemCm, hem, sleeve: null, sleeveCm: null }
  }
  if (kind === 'top' || kind === 'dress') {
    const hemCm = at(BODY.neck) - length
    const hem =
      kind === 'dress'
        ? dressHemOf(hemCm, heightCm)
        : hemCm >= at(BODY.waist) - 2
          ? '허리 위에서 끝나요 (짧아요)'
          : hemCm > at(BODY.hip)
            ? '허리와 엉덩이 사이까지 와요'
            : hemCm >= at(BODY.crotch) - 4
              ? '엉덩이를 덮어요'
              : '허벅지까지 내려와요 (길어요)'
    const sleeveLength = valueOf(spec, '소매')
    const diff = sleeveLength === null ? null : sleeveLength - at(BODY.arm)
    return {
      hemCm,
      hem,
      sleeveCm: sleeveLength,
      sleeve:
        diff === null
          ? null
          : diff < -4
            ? '손목 위에서 끝나요 (짧아요)'
            : diff <= 2
              ? '손목까지 와요'
              : '손등을 덮어요 (길어요)',
    }
  }
  const hemCm = at(BODY.waist) - length
  const hem =
    hemCm > at(BODY.knee)
      ? '무릎 위에서 끝나요 (반바지)'
      : hemCm - at(BODY.ankle) > 5
        ? '발목 위에서 끝나요 (짧아요)'
        : hemCm - at(BODY.ankle) >= -3
          ? '발목까지 와요'
          : '바닥에 끌릴 수 있어요 (길어요)'
  return { hemCm, hem, sleeve: null, sleeveCm: null }
}
