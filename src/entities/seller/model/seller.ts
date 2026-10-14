export type SellerApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export type SellerApplication = {
  id: string
  businessName: string
  representativeName: string
  maskedBusinessRegistrationNumber: string
  status: SellerApplicationStatus
  createdAt: string
  rejectReason: string | null
}

export type SellerApplicationSummary = {
  id: string
  businessName: string
  applicantId: string
  applicantNickname: string
  maskedBusinessRegistrationNumber: string
  status: SellerApplicationStatus
  createdAt: string
}

export type SellerApplicationForm = {
  businessName: string
  representativeName: string
  businessRegistrationNumber: string
}

export const APPLICATION_STATUS_LABEL: Record<SellerApplicationStatus, string> = {
  PENDING: '심사 중',
  APPROVED: '승인됨',
  REJECTED: '거절됨',
}

export type SellerStatus = 'ACTIVE' | 'SUSPENDED'

/** 승인된 판매자 (GET /seller/me) */
export type Seller = { id: string; businessName: string; status: SellerStatus }

export const SELLER_STATUS_LABEL: Record<SellerStatus, string> = {
  ACTIVE: '판매 가능',
  SUSPENDED: '자격 정지',
}
