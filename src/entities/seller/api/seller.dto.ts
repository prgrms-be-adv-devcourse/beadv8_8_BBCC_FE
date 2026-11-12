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

/**
 * GET /admin/seller-applications 한 줄 (백엔드 SellerApplicationSummaryResponse). 승인 · 거절 응답도 같은 모양.
 * 신청한 회원이 탈퇴하면 닉네임 · 사업자등록번호가 null
 */
export type SellerApplicationSummaryDto = {
  id: number
  businessName: string
  applicantId: number
  applicantNickname: string | null
  maskedBusinessRegistrationNumber: string | null
  status: string
  createdAt: string
}

/** POST /members/me/seller-application */
export type SellerApplicationRequestDto = {
  businessName: string
  representativeName: string
  businessRegistrationNumber: string
}

/** POST /admin/seller-applications/{id}/reject */
export type RejectSellerApplicationRequestDto = { reason: string }

/** GET /seller/me (판매자 ID = 회원 ID). 판매자 정보가 없으면 404 */
export type SellerDto = { sellerId: number; businessName: string; status: string }
