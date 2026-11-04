import { useQuery } from '@tanstack/react-query'
import { childAccountApi } from '../api/child-account-api'
import { toChildAccount } from './child-account.mapper'
export const childAccountKeys = { all: ['child-accounts'] as const }
export function useChildAccountsQuery(enabled: boolean) {
  return useQuery({
    enabled,
    queryKey: childAccountKeys.all,
    queryFn: childAccountApi.list,
    select: (list) => list.map(toChildAccount),
  })
}
