import type { SizeRecommendation } from './recommendation'

/**
 * 「후보 110 · 120 중」 문구. 추천 사이즈가 후보 안에 있고 후보가 둘 이상일 때만 보인다.
 * AI가 규칙 후보 밖의 사이즈를 고르면 null (후보 중에서 고른 것처럼 읽히지 않게)
 */
export function candidateNoteOf({
  recommendedSize,
  candidateSizes,
}: Pick<SizeRecommendation, 'recommendedSize' | 'candidateSizes'>): string | null {
  if (!recommendedSize || candidateSizes.length < 2) return null
  if (!candidateSizes.includes(recommendedSize)) return null
  return `후보 ${candidateSizes.join(' · ')} 중`
}
