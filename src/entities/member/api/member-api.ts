import { apiClient, expectShape, type Page } from '@/shared/api'
import type { AdminMemberDto, SuspendRequestDto } from './member.dto'
import { adminMemberPageShape } from './member.shape'

export const adminMemberApi = {
  /** filter ALL · BUYER · SELLER · SUSPENDED. keyword는 회원 번호 · 닉네임 · 이메일 */
  list: (filter: string, keyword: string, page = 0) =>
    apiClient
      .get<Page<AdminMemberDto>>('/admin/members', {
        params: { filter, keyword: keyword.trim() || undefined, page, size: 20 },
      })
      .then(expectShape(adminMemberPageShape)),
  /** 이용 정지 (204). 정지된 회원은 로그인 · 재발급이 막힌다 */
  suspend: (memberId: string, request: SuspendRequestDto) =>
    apiClient.post(`/admin/members/${memberId}/suspend`, request),
}
