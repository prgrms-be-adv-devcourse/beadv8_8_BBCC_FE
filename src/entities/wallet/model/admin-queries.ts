import { useQuery } from '@tanstack/react-query'
import { adminWalletApi } from '../api/admin-wallet-api'
import type { AdminWalletFilter } from './admin-wallet'
import { toAdminWallet, toAdminWalletParams } from './admin-wallet.mapper'

export const adminWalletKeys = {
  all: ['wallet', 'admin'] as const,
  list: (filter: AdminWalletFilter, page: number) =>
    ['wallet', 'admin', filter.frozenOnly, filter.withBalanceOnly, page] as const,
}

export function useAdminWalletsQuery(filter: AdminWalletFilter, page: number) {
  return useQuery({
    queryKey: adminWalletKeys.list(filter, page),
    queryFn: () => adminWalletApi.list(toAdminWalletParams(filter, page)),
    select: (data) => ({ ...data, content: data.content.map(toAdminWallet) }),
  })
}
