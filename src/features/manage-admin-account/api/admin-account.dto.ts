/** POST /admin/admins (백엔드 AdminCreateRequest: 이메일 형식, 비밀번호는 AdminPassword 규칙) */
export type AdminCreateRequestDto = { email: string; password: string }

/** POST /admin/admins 응답 (백엔드 AdminResponse). 모양은 엔티티 adminShape로 검사하고, 엔티티 매퍼 toAdminAccount로 화면 모델을 만든다 */
export type AdminDto = {
  id: number
  email: string
  status: string
  createdAt: string
}
