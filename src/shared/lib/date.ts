/** 한국 시간 기준 날짜 글자 (YYYY-MM-DD). 기기 시간대와 상관없이 KST */
export function kstDateString(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}
