/**
 * 정산 종료 기준일 "YYYY-MM-DD" (이 날짜 이전 구매확정분이 대상, 이 기기 날짜 기준).
 * includeToday면 내일을 보내 오늘 구매확정분까지 넣는다 (시연용)
 */
export function settlementPeriodEnd(today: Date, includeToday: boolean): string {
  const date = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + (includeToday ? 1 : 0),
  )
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
