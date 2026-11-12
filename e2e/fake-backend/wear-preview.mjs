// 가짜 백엔드의 착용 미리보기 (BE #1265): 사이즈 추천 응답의 wearPreview 모양만 흉내 낸다.
// BE는 나이 · 성별별 몸 높이 비율 표를 쓰지만, 가짜는 키 대비 고정 비율 하나로 계산한다
import { garmentPartOfCategory } from './reference-garments.mjs'

const RATIO = {
  neck: 0.81,
  shoulder: 0.79,
  waist: 0.6,
  hip: 0.5,
  crotch: 0.46,
  knee: 0.27,
  ankle: 0.045,
  arm: 0.35,
  elbow: 0.2,
}
// 무릎 · 복사뼈 · 손목 언저리 2cm 안이면 그 관절에 닿는다고 본다
const JOINT = 2
const round = (value) => Math.round(value * 10) / 10

function hemAtOf(hem, h) {
  const at = (key) => RATIO[key] * h
  if (hem > at('waist')) return 'ABOVE_WAIST'
  if (hem > at('hip')) return 'WAIST_HIP'
  if (hem > at('crotch')) return 'HIP'
  if (hem > (at('crotch') + at('knee')) / 2) return 'THIGH'
  if (hem > at('knee') + JOINT) return 'ABOVE_KNEE'
  if (hem >= at('knee') - JOINT) return 'KNEE'
  if (hem > at('ankle') + JOINT) return 'BELOW_KNEE'
  if (hem >= at('ankle') - JOINT) return 'ANKLE'
  return 'FLOOR'
}

function sleeveAtOf(sleeve, h) {
  const arm = RATIO.arm * h
  if (sleeve <= RATIO.elbow * h) return 'ELBOW'
  if (sleeve < arm - JOINT) return 'ABOVE_WRIST'
  if (sleeve <= arm + JOINT) return 'WRIST'
  return 'HAND'
}

/** 상품 상세(sizeSpecs[].measurements: 코드 → cm)와 자녀 키로 만든다. 사이즈 무관 · 칸이 없는 옷이면 null */
export function wearPreviewOf(detail, heightCm) {
  const garment = garmentPartOfCategory(detail.categoryId)
  if (detail.sizeFree || garment === null) return null
  const isBottomWear = garment === 'BOTTOM' || garment === 'SKIRT'
  const h = heightCm
  const body = Object.fromEntries(
    ['neck', 'shoulder', 'waist', 'hip', 'crotch', 'knee', 'ankle', 'arm'].map((key) => [
      `${key}Cm`,
      round(RATIO[key] * h),
    ]),
  )
  const sizes = detail.sizeSpecs.map((spec) => {
    const length = spec.measurements?.TOTAL_LENGTH
    const sleeve = spec.measurements?.SLEEVE_LENGTH
    const rawHem = length == null ? null : (isBottomWear ? RATIO.waist : RATIO.neck) * h - length
    const hasSleeve = sleeve != null && !isBottomWear
    return {
      size: spec.size,
      hemCm: rawHem === null ? null : round(Math.max(0, rawHem)),
      hemAt: rawHem === null ? null : hemAtOf(rawHem, h),
      sleeveCm: hasSleeve ? round(sleeve) : null,
      sleeveAt: hasSleeve ? sleeveAtOf(sleeve, h) : null,
    }
  })
  return { garment, body, sizes }
}
