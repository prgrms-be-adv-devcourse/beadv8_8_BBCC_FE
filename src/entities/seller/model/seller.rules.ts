import type { SellerApplication, SellerApplicationForm, SellerApplicationSummary } from './seller'

/** 서버 검증과 같은 규칙. 문제가 없으면 null */
export function validateSellerApplicationForm(form: SellerApplicationForm): string | null {
  if (!form.businessName.trim() || !form.representativeName.trim())
    return '상호명과 대표자명을 입력해 주세요.'
  if (!/^\d{10}$/.test(form.businessRegistrationNumber.trim()))
    return '사업자등록번호는 하이픈 없는 숫자 10자리예요.'
  return null
}

export function canApprove(application: SellerApplicationSummary): boolean {
  return application.status === 'PENDING'
}

/** 백엔드 SellerApplication.REJECT_REASON_MAX_LENGTH */
export const REJECT_REASON_MAX = 200

/** 거절 사유 검증 (보낼 때는 앞뒤 공백을 뺀다). 문제가 없으면 null */
export function validateRejectReason(reason: string): string | null {
  const value = reason.trim()
  if (!value) return '거절 사유를 입력해 주세요.'
  if (value.length > REJECT_REASON_MAX) return `거절 사유는 ${REJECT_REASON_MAX}자까지예요.`
  return null
}

/** 신청한 적이 없거나 거절됐으면 다시 신청할 수 있다 (심사 중 · 승인됨은 불가) */
export function canReapply(application: SellerApplication | null): boolean {
  return application === null || application.status === 'REJECTED'
}

/** 백엔드 NAME_MAX_LENGTH (상호명 · 대표자명) */
export const BUSINESS_NAME_MAX = 50

export function validateBusinessName(name: string): string | null {
  const value = name.trim()
  if (!value) return '상호명을 입력해 주세요.'
  if (value.length > BUSINESS_NAME_MAX) return `상호명은 ${BUSINESS_NAME_MAX}자까지예요.`
  return null
}
