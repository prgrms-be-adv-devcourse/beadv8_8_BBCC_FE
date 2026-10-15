/** 요청이 미리 밝혀 둔 "예상되는 오류 응답" (예: 개발용 토큰의 내 정보 404) */
export type ExpectedResponse = {
  statuses: number[]
  /** 흐름 패널에 보여 줄 이유 */
  reason: string
}

/** 응답이 예상된 것이면 그 이유, 아니면 null */
export function expectedReasonOf(
  status: number | null,
  expected: ExpectedResponse | undefined,
): string | null {
  if (status === null || !expected) {
    return null
  }
  return expected.statuses.includes(status) ? expected.reason : null
}

/** 흐름 패널 실패 수에 넣을 호출: 응답 없음 · 4xx · 5xx 중 예상되지 않은 것 */
export function isFailedCall(log: { status: number | null; expectedReason?: string | null }) {
  if (log.expectedReason) {
    return false
  }
  return log.status === null || log.status >= 400
}
