/** 상태 코드 색: 2xx 초록 · 4xx 주황 · 5xx와 응답 없음 빨강 */
export function statusColor(status: number | null): string {
  if (status === null || status >= 500) return 'text-destructive'
  if (status >= 400) return 'text-orange-600'
  return 'text-green-700'
}
