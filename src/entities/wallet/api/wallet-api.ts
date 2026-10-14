import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import type { WalletBalance } from '../model/types'

export const walletKeys = {
  me: ['wallet', 'me'] as const,
}

export const walletApi = {
  getMine: () => apiClient.get<WalletBalance>('/wallets/me').then((response) => response.data),
}

export function useWalletQuery() {
  return useQuery({ queryKey: walletKeys.me, queryFn: walletApi.getMine })
}
