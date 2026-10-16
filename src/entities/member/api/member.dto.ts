/**
 * GET /admin/members 한 줄 (백엔드 AdminMemberSummaryResponse). 탈퇴 회원은 빠진다.
 * 관리자는 filter=ADMIN에서만 나오고 역할 필드는 없다 (BE #356)
 */
export type AdminMemberDto = {
  id: number
  nickname: string
  /** 이메일을 받기 전에 가입한 회원은 null (BE #242) */
  email?: string | null
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
