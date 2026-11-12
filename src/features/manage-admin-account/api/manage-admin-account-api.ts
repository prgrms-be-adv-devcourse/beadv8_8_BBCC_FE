import { apiClient, expectShape } from '@/shared/api'
import type { AdminCreateRequestDto, AdminDto } from './admin-account.dto'
import { adminShape } from './admin-account.shape'

/** 관리자 계정 (BE AdminAccountController). 관리자 목록 조회 API는 없다 */
export const manageAdminAccountApi = {
  /** 201 + Location. 이미 있는 이메일(대소문자 · 앞뒤 공백 무시)이면 409, 비밀번호 규칙에 어긋나면 400 */
  create: (request: AdminCreateRequestDto) =>
    apiClient.post<AdminDto>('/admin/admins', request).then(expectShape(adminShape)),
  /** 204. 이미 비활성이어도 204, 자기 자신이면 409, 없는 관리자면 404 */
  disable: (adminId: string) => apiClient.post<void>(`/admin/admins/${adminId}/disable`),
}
