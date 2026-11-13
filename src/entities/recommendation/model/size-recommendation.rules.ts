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

/** 사이즈 근거 아래 AI 안내: AI가 정한 추천이고 근거 문장이 있을 때만 (규칙 추천 · 근거 없음이면 숨김) */
export function showsAiSizeNotice({
  source,
  reasons,
}: Pick<SizeRecommendation, 'source' | 'reasons'>): boolean {
  return source === 'AI' && reasons.length > 0
}

/**
 * 지난 구매 줄 (BE #1299): 같은 기준 옷 칸에서 마지막으로 구매확정한 사이즈. 사이즈 이름마다 을/를이
 * 달라지지 않게 「사이즈를」로 고정한다. 없거나 비어 있으면 null (줄을 숨긴다)
 */
export function lastPurchaseTextOf({
  lastPurchasedSize,
}: Pick<SizeRecommendation, 'lastPurchasedSize'>): string | null {
  const size = lastPurchasedSize?.trim()
  return size ? `지난번 같은 종류는 ${size} 사이즈를 샀어요` : null
}

/**
 * 사이즈 추천 스트림에서 받은 결과(도착 순서) 중 그릴 것: 마지막 AI, 없으면 마지막 규칙 결과.
 * 받은 것이 없으면 undefined (쿼리가 오류로 바꾼다)
 */
export function shownSizeOf(received: SizeRecommendation[]): SizeRecommendation | undefined {
  return (
    received.findLast((item) => item.source === 'AI') ??
    received.findLast((item) => item.source === 'RULE')
  )
}
