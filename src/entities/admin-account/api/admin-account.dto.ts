/**
 * 관리자 계정 한 명 (백엔드 AdminResponse). POST /admin/admins 응답 · GET /admin/admins 목록 한 줄.
 * 이메일은 서버가 앞뒤 공백을 빼고 소문자로 바꾼 값
 */
export type AdminDto = {
  id: number
  email: string
  /** ACTIVE · DISABLED */
  status: string
  createdAt: string
}
