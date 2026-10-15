/** 서버 기준 날짜(한국 시간) "YYYY-MM-DD". 기기 시간대와 상관없이 같게 (CI는 UTC) */
const seoulDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/**
 * 정산 종료 기준일 "YYYY-MM-DD" (이 날짜 이전 구매확정분이 대상). 날짜는 한국 시간 기준이다
 * (구매확정 시각 · BE 정산 기준이 한국 시간). includeToday면 내일을 보내 오늘 구매확정분까지 넣는다 (시연용)
 */
export function settlementPeriodEnd(now: Date, includeToday: boolean): string {
  const today = seoulDate.format(now)
  if (!includeToday) return today
  const [year, month, day] = today.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10)
}
