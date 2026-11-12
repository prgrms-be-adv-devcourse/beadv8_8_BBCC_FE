import { useQuery } from '@tanstack/react-query'
import { adminAccountApi } from '../api/admin-account-api'
import { toAdminAccount } from './admin-account.mapper'

// all 아래에 둔다 → 관리자 추가 · 비활성화가 무효화하면 모든 페이지를 새로 받는다
export const adminAccountKeys = {
  all: ['admin-accounts'] as const,
  list: (page: number) => ['admin-accounts', page] as const,
}

export function useAdminAccountsQuery(page: number) {
  return useQuery({
    queryKey: adminAccountKeys.list(page),
    queryFn: () => adminAccountApi.list(page),
    select: (data) => ({ ...data, content: data.content.map(toAdminAccount) }),
  })
}
