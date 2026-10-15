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

export type GarmentKind = 'top' | 'bottom'

export type WearFit = {
  /** 밑단(상의) · 바지 끝(하의) 위치, 바닥에서 cm */
  hemCm: number
  hem: string
  /** 상의만: 소매 끝 */
  sleeve: string | null
  sleeveCm: number | null
}

const valueOf = (spec: SizeSpec, name: string) =>
  spec.measurements.find((item) => item.name.includes(name) && item.value !== null)?.value ?? null

/** 실측 이름으로 상의 · 하의를 가른다. 총장이 없으면 그릴 수 없다 */
export function garmentKindOf(spec: SizeSpec): GarmentKind | null {
  if (valueOf(spec, '총장') === null) return null
  if (spec.measurements.some((item) => /소매|어깨|가슴/.test(item.name))) return 'top'
  if (spec.measurements.some((item) => /허리|밑위|허벅지|인심/.test(item.name))) return 'bottom'
  return null
}

export function wearFitOf(spec: SizeSpec, heightCm: number): WearFit | null {
  const kind = garmentKindOf(spec)
  const length = valueOf(spec, '총장')
  if (!kind || length === null) return null
  const at = (ratio: number) => ratio * heightCm
  if (kind === 'top') {
    const hemCm = at(BODY.neck) - length
    const hem =
      hemCm >= at(BODY.waist) - 2
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
