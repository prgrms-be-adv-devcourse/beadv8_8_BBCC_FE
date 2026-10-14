import type { SellerApplicationForm, SellerApplicationSummary } from './seller'

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
