/** 팝업이 AI 답을 기다리는 상한. 넘으면 받아 둔 규칙 결과를 먼저 그린다 (잰 가장 느린 AI 답은 4.5초) */
export const QUICK_SIZE_WAIT_LIMIT_MS = 5000

type QuickSizeWaitingInput = {
  /** 첫 결과(보통 규칙 결과)를 아직 받지 못했다 */
  isLoading: boolean
  /** 스트림이 열려 있고 받은 결과가 AI 답이 아니다 */
  isWaitingForAi: boolean
  /** AI 답을 기다린 시간이 상한을 넘었다 */
  hasWaitedLimit: boolean
}

/**
 * 담기 팝업이 「추천 계산 중」을 보일지. 팝업은 규칙 결과를 먼저 그리지 않고,
 * AI 답이 오거나 스트림이 닫힐 때까지 기다린다 (칸 높이가 한 번만 정해지게).
 * 상한을 넘기면 받아 둔 규칙 결과를 그리고, 받은 결과가 없으면 계속 기다린다
 */
export function isQuickSizeWaiting({
  isLoading,
  isWaitingForAi,
  hasWaitedLimit,
}: QuickSizeWaitingInput): boolean {
  return isLoading || (isWaitingForAi && !hasWaitedLimit)
}

/** 사이즈 버튼에 「추천」을 붙일 사이즈. 기다리는 동안에는 붙이지 않아 추천 한 줄과 함께 나타난다 */
export function quickRecommendedSizeOf(
  recommendation: { recommendedSize: string | null } | undefined,
  isWaiting: boolean,
): string | null {
  if (isWaiting) return null
  return recommendation?.recommendedSize ?? null
}
