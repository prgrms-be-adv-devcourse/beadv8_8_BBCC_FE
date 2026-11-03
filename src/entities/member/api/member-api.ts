import { apiClient, expectShape, type Page } from '@/shared/api'
import type { AdminMemberDto, SuspendRequestDto } from './member.dto'
import { adminMemberPageShape } from './member.shape'

export const adminMemberApi = {
  /** filter ALL이면 일반 회원 전체, ADMIN이면 관리자만. keyword는 회원 번호 · 닉네임 · 이메일 */
  list: (filter: string, keyword: string) =>
    apiClient
      .get<Page<AdminMemberDto>>('/admin/members', {
        params: { filter, keyword: keyword.trim() || undefined, page: 0, size: 20 },
      })
      .then(expectShape(adminMemberPageShape)),
  /** 이용 정지 (204). 정지된 회원은 로그인 · 재발급이 막힌다 */
  suspend: (memberId: string, request: SuspendRequestDto) =>
    apiClient.post(`/admin/members/${memberId}/suspend`, request),
}
