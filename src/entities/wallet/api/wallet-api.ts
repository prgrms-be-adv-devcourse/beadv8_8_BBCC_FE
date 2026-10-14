import { useQueries, useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import type { ChargeDetail, WalletBalance } from '../model/types'

export const walletKeys = {
  me: ['wallet', 'me'] as const,
  charge: (chargeId: number) => ['wallet', 'charge', chargeId] as const,
}

export const walletApi = {
  getMine: () => apiClient.get<WalletBalance>('/wallets/me').then((response) => response.data),
  getCharge: (chargeId: number) =>
    apiClient
      .get<ChargeDetail>(`/wallets/me/charges/${chargeId}`)
      .then((response) => response.data),
}

export function useWalletQuery() {
  return useQuery({ queryKey: walletKeys.me, queryFn: walletApi.getMine })
}

export function useChargesQuery(chargeIds: number[]) {
  return useQueries({
    queries: chargeIds.map((chargeId) => ({
      queryKey: walletKeys.charge(chargeId),
      queryFn: () => walletApi.getCharge(chargeId),
    })),
  })
}
