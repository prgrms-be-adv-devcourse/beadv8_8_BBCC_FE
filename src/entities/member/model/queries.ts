import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { adminMemberApi } from '../api/member-api'
import type { MemberFilter } from './member'
import { toAdminMember } from './member.mapper'
import { findAdminMember } from './member.rules'

export const memberKeys = {
  all: ['admin-members'] as const,
  list: (filter: MemberFilter, keyword: string, page = 0) =>
    ['admin-members', filter, keyword, page] as const,
}

/** 관리자 회원 목록 (20명씩, page는 0부터). 쪽을 넘기는 동안 앞 쪽을 보여 준다 */
export function useAdminMembersQuery(filter: MemberFilter, keyword: string, page = 0) {
  return useQuery({
    queryKey: memberKeys.list(filter, keyword, page),
    queryFn: () => adminMemberApi.list(filter, keyword, page),
    select: (result) => ({
      ...result,
      content: result.content.map(toAdminMember),
    }),
    placeholderData: keepPreviousData,
  })
}

/** 회원 한 명 (상세 화면). 회원 하나 API가 없어 전체 목록을 회원 번호로 찾는다 */
export function useAdminMemberQuery(memberId: string) {
  const { data, isPending, error } = useAdminMembersQuery('ALL', memberId)
  return { member: findAdminMember(data?.content, memberId), isPending, error }
}
