import { useQuery } from '@tanstack/react-query'
import { adminMemberApi } from '../api/member-api'
import type { MemberFilter } from './member'
import { toAdminMember } from './member.mapper'

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
