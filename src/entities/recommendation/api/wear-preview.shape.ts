import { arr, nullable, num, obj, oneOf, str } from '@/shared/api'

const HEM_AT = oneOf([
  'ABOVE_WAIST',
  'WAIST_HIP',
  'HIP',
  'THIGH',
  'ABOVE_KNEE',
  'KNEE',
  'BELOW_KNEE',
  'ANKLE',
  'FLOOR',
])
const SLEEVE_AT = oneOf(['ELBOW', 'ABOVE_WRIST', 'WRIST', 'HAND'])

/** 사이즈 추천 응답의 착용 미리보기 (BE #1265) */
export const wearPreviewShape = obj({
  garment: oneOf(['TOP', 'BOTTOM', 'OUTER', 'DRESS', 'SKIRT']),
  body: obj({
    neckCm: num,
    shoulderCm: num,
    waistCm: num,
    hipCm: num,
    crotchCm: num,
    kneeCm: num,
    ankleCm: num,
    armCm: num,
  }),
  sizes: arr(
    obj({
      size: str,
      hemCm: nullable(num),
      hemAt: nullable(HEM_AT),
      sleeveCm: nullable(num),
      sleeveAt: nullable(SLEEVE_AT),
    }),
  ),
})
