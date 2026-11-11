import type { RecommendedPicks } from './recommendation'

/**
 * 스트림이 닫힐 때까지 받은 추천 결과(도착 순서)에서 화면에 그릴 것을 고른다.
 * AI 답이 있으면 AI, AI 없이 닫혔으면 규칙 결과. 받은 것이 없거나 고른 결과의 상품이 없으면 null(영역을 숨긴다)
 */
export function shownPicksOf(received: RecommendedPicks[]): RecommendedPicks | null {
  const picked =
    received.findLast((picks) => picks.source === 'AI') ??
    received.findLast((picks) => picks.source === 'RULE')
  return picked && picked.products.length > 0 ? picked : null
}
