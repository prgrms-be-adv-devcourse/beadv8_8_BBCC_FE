import type { Fit } from './recommendation'
import type { GarmentPart } from './reference-garment'

/** 실측 항목 하나: 기준 옷 실측과 사이즈별 상품 실측 · 차이(상품 − 기준 옷, cm) */
export type ReferenceFitItem = {
  code: string
  garmentCm: number
  sizes: { size: string; productCm: number; diffCm: number }[]
}

/**
 * 기준 핏 (BE #1261): 사려는 상품의 칸(productPart)과 비교한 기준 옷 칸(comparedPart).
 * 둘이 다르면 다른 칸의 기준 옷으로 대신 비교한 것이고 너비 항목만 있다
 */
export type ReferenceFit = {
  productPart: GarmentPart
  comparedPart: GarmentPart
  items: ReferenceFitItem[]
}

/** 추천 사이즈의 항목별 AI 판단. allowance는 AI가 맞다고 본 여유 범위(cm) */
export type ItemJudgement = {
  code: string
  diffCm: number
  fit: Fit
  allowanceMinCm: number
  allowanceMaxCm: number
}
