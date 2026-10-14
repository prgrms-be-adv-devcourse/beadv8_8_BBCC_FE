import { useQueries, useQuery } from '@tanstack/react-query'
import { walletApi } from '../api/wallet-api'
import type { Wallet } from './wallet'
import { toCharge } from './wallet.mapper'

export const walletKeys = {
  me: ['wallet', 'me'] as const,
  charge: (chargeId: string) => ['wallet', 'charge', chargeId] as const,
}

export function useWalletQuery() {
  return useQuery({
    queryKey: walletKeys.me,
    queryFn: walletApi.getMine,
    select: (dto): Wallet => ({ balance: dto.balance }),
  })
}

export function useChargesQuery(chargeIds: string[]) {
  return useQueries({
    queries: chargeIds.map((chargeId) => ({
      queryKey: walletKeys.charge(chargeId),
      queryFn: () => walletApi.getCharge(chargeId),
      select: toCharge,
    })),
  })
}
