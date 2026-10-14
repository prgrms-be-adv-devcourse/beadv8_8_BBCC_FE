/** 25000 → "25,000원" */
export function formatWon(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`
}

/** "2026-10-08T10:00:00" → "2026-10-08 10:00" (서버 시각은 한국 시간이라 변환하지 않는다) */
export function formatDateTime(value: string | null): string {
  return value ? value.replace('T', ' ').slice(0, 16) : '-'
}
