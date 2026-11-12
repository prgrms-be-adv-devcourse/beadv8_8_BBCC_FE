import { getErrorMessage, getErrorStatus } from '@/shared/api'

/**
 * 탈퇴 실패 문구. 기본은 ProblemDetail detail 그대로 (판매자 차단 409는 남은 항목 · 건수를 서버가 적어 준다).
 * 503은 탈퇴 조건 확인 실패(BE SELLER_WITHDRAWAL_CHECK_UNAVAILABLE)와 게이트웨이의 서비스 중단이 둘 다 내므로
 * 두 경우에 모두 맞는 문구로 탈퇴되지 않았다고 알린다
 */
export function withdrawErrorMessage(error: unknown): string {
  if (getErrorStatus(error) === 503) return '탈퇴하지 못했어요. 잠시 뒤 다시 시도해 주세요.'
  return getErrorMessage(error)
}
