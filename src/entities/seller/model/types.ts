export type SellerApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

/** GET /members/me/seller-application (내 최근 신청) */
export type SellerApplication = {
  id: number
  businessName: string
  representativeName: string
  maskedBusinessRegistrationNumber: string
  status: SellerApplicationStatus
  createdAt: string
  decidedAt: string | null
  rejectReason: string | null
}

/** GET /admin/seller-applications 한 줄 */
export type SellerApplicationSummary = {
  id: number
  businessName: string
  applicantId: number
  applicantNickname: string
  maskedBusinessRegistrationNumber: string
  status: SellerApplicationStatus
  createdAt: string
}

export const APPLICATION_STATUS_LABEL: Record<SellerApplicationStatus, string> = {
  PENDING: '심사 중',
  APPROVED: '승인됨',
  REJECTED: '거절됨',
}
