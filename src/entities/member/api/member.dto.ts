/** GET /admin/members 한 줄 (백엔드 AdminMemberSummaryResponse). 관리자 · 탈퇴 회원은 빠진다 */
export type AdminMemberDto = {
  id: number
  nickname: string
  /** ACTIVE · SUSPENDED */
  status: string
  /** 판매자가 아니면 null */
  sellerStatus: string | null
  /** 이용 정지된 회원만 값이 있다 */
  suspendReason: string | null
  suspendedAt: string | null
  createdAt: string
}

/** POST /admin/members/{id}/suspend · POST /admin/sellers/{id}/suspend */
export type SuspendRequestDto = { reason: string }
