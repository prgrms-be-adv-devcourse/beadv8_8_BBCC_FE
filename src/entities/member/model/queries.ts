import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { adminMemberApi } from '../api/member-api'
import type { MemberFilter } from './member'
import { toAdminMember } from './member.mapper'
import { findAdminMember } from './member.rules'

export const memberKeys = {
  all: ['admin-members'] as const,
  list: (filter: MemberFilter, keyword: string, page: number) =>
    ['admin-members', filter, keyword, page] as const,
}

/** 회원 목록 한 페이지 (page는 0부터). 페이지를 바꾸는 동안 앞 페이지를 그대로 보인다 */
export function useAdminMembersQuery(filter: MemberFilter, keyword: string, page = 0) {
  return useQuery({
    queryKey: memberKeys.list(filter, keyword, page),
    queryFn: () => adminMemberApi.list(filter, keyword, page),
    placeholderData: keepPreviousData,
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
