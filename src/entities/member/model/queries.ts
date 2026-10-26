import { useQuery } from '@tanstack/react-query'
import { adminMemberApi } from '../api/member-api'
import type { MemberFilter } from './member'
import { toAdminMember } from './member.mapper'
import { findAdminMember } from './member.rules'

export const memberKeys = {
  all: ['admin-members'] as const,
  list: (filter: MemberFilter, keyword: string) => ['admin-members', filter, keyword] as const,
}

export function useAdminMembersQuery(filter: MemberFilter, keyword: string) {
  return useQuery({
    queryKey: memberKeys.list(filter, keyword),
    queryFn: () => adminMemberApi.list(filter, keyword),
    select: (page) => ({
      ...page,
      content: page.content.map((dto) => toAdminMember(dto, filter === 'ADMIN')),
    }),
  })
}

/**
 * 회원 한 명 (상세 화면). 회원 하나 API가 없어 회원 번호로 일반 · 관리자 목록을 함께 찾는다
 * (관리자는 filter=ADMIN에서만 나오고, 관리자로 지정하면 일반 목록에서 빠진다)
 */
export function useAdminMemberQuery(memberId: string) {
  const general = useAdminMembersQuery('ALL', memberId)
  const admins = useAdminMembersQuery('ADMIN', memberId)
  return {
    member: findAdminMember(general.data?.content, admins.data?.content, memberId),
    isPending: general.isPending || admins.isPending,
    error: general.error ?? admins.error,
  }
}
