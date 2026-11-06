/** 25000 → "25,000원" */
export function formatWon(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`
}

/** "2026-10-08T10:00:00" → "2026-10-08 10:00" (서버 시각은 한국 시간이라 변환하지 않는다) */
export function formatDateTime(value: string | null): string {
  return value ? value.replace('T', ' ').slice(0, 16) : '-'
}

/** 받침에 맞춰 목적격 조사를 붙인다: "색상" → "색상을", "사이즈" → "사이즈를". 한글로 끝나지 않으면 "을(를)" */
export function withObjectParticle(word: string): string {
  const last = word.charCodeAt(word.length - 1)
  if (!(last >= 0xac00 && last <= 0xd7a3)) return `${word}을(를)`
  return (last - 0xac00) % 28 === 0 ? `${word}를` : `${word}을`
}
