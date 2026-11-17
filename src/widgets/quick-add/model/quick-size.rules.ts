type QuickSizeWaitingInput = {
  /** 첫 결과(보통 규칙 결과)를 아직 받지 못했다 */
  isLoading: boolean
  /** 스트림이 열려 있고 받은 결과가 AI 답이 아니다 */
  isWaitingForAi: boolean
}

/**
 * 담기 팝업이 「추천 계산 중」을 보일지. 팝업은 규칙 결과를 먼저 그리지 않고,
 * AI 답이 오거나 스트림이 닫힐 때까지 기다린다 (칸 높이가 한 번만 정해지게)
 */
export function isQuickSizeWaiting({ isLoading, isWaitingForAi }: QuickSizeWaitingInput): boolean {
  return isLoading || isWaitingForAi
}

/** 사이즈 버튼에 「추천」을 붙일 사이즈. 기다리는 동안에는 붙이지 않아 추천 한 줄과 함께 나타난다 */
export function quickRecommendedSizeOf(
  recommendation: { recommendedSize: string | null } | undefined,
  isWaiting: boolean,
): string | null {
  if (isWaiting) return null
  return recommendation?.recommendedSize ?? null
}
