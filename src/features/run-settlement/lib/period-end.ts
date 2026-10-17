/** 서버 기준 날짜(한국 시간) "YYYY-MM-DD". 기기 시간대와 상관없이 같게 (CI는 UTC) */
const seoulDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/**
 * 정산 종료 기준일 "YYYY-MM-DD" = 오늘(한국 시간). 이날 0시 전, 즉 어제까지 구매확정된 대상을 정산한다.
 * BE는 오늘 이후 날짜를 거절한다(INVALID_SETTLEMENT_CUTOFF). 오늘 구매확정분은 내일 정산 대상이다
 */
export function settlementPeriodEnd(now: Date): string {
  return seoulDate.format(now)
}
