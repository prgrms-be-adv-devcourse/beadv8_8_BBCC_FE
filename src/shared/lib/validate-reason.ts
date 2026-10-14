/** 정지 · 거절 사유 공통 기준 (백엔드 @NotBlank · @Size(max = 200)) */
export const REASON_MAX = 200

/** 앞뒤 공백을 뺀 길이로 본다. 문제가 없으면 null */
export function validateReason(reason: string): string | null {
  const value = reason.trim()
  if (!value) return '사유를 입력해 주세요.'
  if (value.length > REASON_MAX) return `사유는 ${REASON_MAX}자까지예요.`
  return null
}
