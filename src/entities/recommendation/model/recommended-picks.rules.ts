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

/** AI가 쓴 이유가 하나라도 보이는지 (보이면 「AI가 쓴 문장」 안내를 단다) */
export function hasAiReasons(picks: RecommendedPicks): boolean {
  return picks.source === 'AI' && picks.products.some((product) => product.reason !== null)
}

/**
 * 규칙 결과를 그린 뒤 「AI 분석 중」을 보일지. BE에는 대기 중 칸이 없어 스트림이 열려 있는 동안을 대기 중으로 본다.
 * 그리는 결과가 AI면 더 기다리지 않는다. 규칙 결과가 빈 목록(null)이어도 열려 있으면 AI 답을 기다린다.
 * 사이즈 추천처럼 source를 가진 결과에도 쓴다
 */
export function isWaitingForAi(
  picks: Pick<RecommendedPicks, 'source'> | null | undefined,
  isStreamOpen: boolean,
): boolean {
  return isStreamOpen && picks?.source !== 'AI'
}
