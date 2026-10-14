/** GET /members/me/seller-application (백엔드 SellerApplicationResponse) */
export type SellerApplicationDto = {
  id: number
  businessName: string
  representativeName: string
  maskedBusinessRegistrationNumber: string
  status: string
  createdAt: string
  decidedAt: string | null
  rejectReason: string | null
}

/** GET /admin/seller-applications 한 줄 (백엔드 SellerApplicationSummaryResponse) */
export type SellerApplicationSummaryDto = {
  id: number
  businessName: string
  applicantId: number
  applicantNickname: string
  maskedBusinessRegistrationNumber: string
  status: string
  createdAt: string
}

/** POST /members/me/seller-application */
export type SellerApplicationRequestDto = {
  businessName: string
  representativeName: string
  businessRegistrationNumber: string
}
