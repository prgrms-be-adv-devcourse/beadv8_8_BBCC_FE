import type { ModerationAction, ModerationReason, ModerationStatus } from './admin-review'

/** 탭 순서: 관리자가 판단할 숨김부터 */
export const ADMIN_REVIEW_STATUSES: readonly ModerationStatus[] = [
  'HIDDEN',
  'CONFIRMED_HIDDEN',
  'RESTORED',
  'PENDING',
  'PASSED',
]

export const MODERATION_STATUS_LABEL: Record<ModerationStatus, string> = {
  HIDDEN: '숨김 (판단 대기)',
  CONFIRMED_HIDDEN: '숨김 확정',
  RESTORED: '다시 공개',
  PENDING: '검사 대기',
  PASSED: '통과',
}

export const MODERATION_REASON_LABEL: Record<ModerationReason, string> = {
  PROFANITY: '욕설 · 비속어',
  HATE: '혐오',
  SEXUAL: '선정성',
  VIOLENCE: '폭력',
  ILLEGAL: '불법',
  PRIVACY: '개인정보',
  OTHER: '기타',
}

export const MODERATION_ACTION_LABEL: Record<ModerationAction, string> = {
  HIDDEN: '숨김 확정',
  VISIBLE: '다시 공개',
}

export function isModerationStatus(value: string | null): value is ModerationStatus {
  return ADMIN_REVIEW_STATUSES.some((status) => status === value)
}

/** 주소 ?status= → 상태. 없거나 모르는 값이면 관리자가 먼저 볼 숨김(판단 대기) */
export function moderationStatusOf(value: string | null): ModerationStatus {
  return isModerationStatus(value) ? value : 'HIDDEN'
}

/** 누를 수 있는 조치. 숨김 확정 → CONFIRMED_HIDDEN, 다시 공개 → RESTORED라 결과가 지금과 같은 조치는 뺀다 */
export function moderationActionsOf(status: ModerationStatus): ModerationAction[] {
  if (status === 'HIDDEN') return ['HIDDEN', 'VISIBLE']
  if (status === 'CONFIRMED_HIDDEN') return ['VISIBLE']
  return ['HIDDEN']
}

/** 다시 검사 결과 안내. resetCount는 다시 검사 대기로 돌린 리뷰 수 (다시 눌러 0이면 할 것이 없다) */
export function retryExhaustedMessage(resetCount: number): string {
  return resetCount > 0
    ? `${resetCount}건을 다시 검사 대기로 돌렸어요. 1분 안에 다시 검사해요.`
    : '다시 검사할 리뷰가 없어요.'
}
