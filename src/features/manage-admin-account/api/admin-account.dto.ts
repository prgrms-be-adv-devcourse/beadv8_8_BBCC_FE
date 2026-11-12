/** POST /admin/admins (백엔드 AdminCreateRequest: 이메일 형식, 비밀번호는 AdminPassword 규칙) */
export type AdminCreateRequestDto = { email: string; password: string }

/** POST /admin/admins 응답 (백엔드 AdminResponse). 이메일은 서버가 앞뒤 공백을 빼고 소문자로 바꾼 값 */
export type AdminDto = {
  id: number
  email: string
  status: string
  createdAt: string
}
