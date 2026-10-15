import { useQuery } from '@tanstack/react-query'
import { walletApi } from '../api/wallet-api'
import type { Wallet } from './wallet'
import { toCharge, toWalletTransaction } from './wallet.mapper'

export const walletKeys = {
  all: ['wallet'] as const,
  me: ['wallet', 'me'] as const,
  charge: (chargeId: string) => ['wallet', 'charge', chargeId] as const,
  charges: ['wallet', 'charges'] as const,
  transactions: ['wallet', 'transactions'] as const,
}

export function useWalletQuery() {
  return useQuery({
    queryKey: walletKeys.me,
    queryFn: walletApi.getMine,
    select: (dto): Wallet => ({ balance: dto.balance }),
  })
}

export function useChargeHistoryQuery() {
  return useQuery({
    queryKey: walletKeys.charges,
    queryFn: walletApi.listCharges,
    select: (page) => page.content.map(toCharge),
  })
}

export function useWalletTransactionsQuery() {
  return useQuery({
    queryKey: walletKeys.transactions,
    queryFn: walletApi.listTransactions,
    select: (page) => page.content.map(toWalletTransaction),
  })
}
