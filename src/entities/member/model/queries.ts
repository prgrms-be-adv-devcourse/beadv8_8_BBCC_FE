import { useQuery } from '@tanstack/react-query'
import { adminMemberApi } from '../api/member-api'
import type { MemberFilter } from './member'
import { toAdminMember } from './member.mapper'
import { findAdminMember } from './member.rules'

export const memberKeys = {
  all: ['admin-members'] as const,
  list: (filter: MemberFilter, keyword: string, page: number) =>
    ['admin-members', filter, keyword, page] as const,
}

/**
 * 회원 목록 한 페이지 (page는 0부터). 같은 구분 · 검색어에서 페이지만 바꿀 때 앞 페이지를 그대로 보인다
 * (구분 · 검색어가 바뀌면 이전 조건의 목록을 보이지 않고 불러오는 중으로)
 */
export function useAdminMembersQuery(filter: MemberFilter, keyword: string, page = 0) {
  return useQuery({
    queryKey: memberKeys.list(filter, keyword, page),
    queryFn: () => adminMemberApi.list(filter, keyword, page),
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[1] === filter && previousQuery.queryKey[2] === keyword
        ? previous
        : undefined,
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
