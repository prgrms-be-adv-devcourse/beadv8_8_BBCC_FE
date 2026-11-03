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
      content: page.content.map(toAdminMember),
    }),
  })
}

/** 회원 한 명 (상세 화면). 회원 하나 API가 없어 전체 목록을 회원 번호로 찾는다 */
export function useAdminMemberQuery(memberId: string) {
  const { data, isPending, error } = useAdminMembersQuery('ALL', memberId)
  return { member: findAdminMember(data?.content, memberId), isPending, error }
}
