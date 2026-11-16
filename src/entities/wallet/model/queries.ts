import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { walletApi } from '../api/wallet-api'
import type { Wallet } from './wallet'
import { toCharge, toWalletTransaction } from './wallet.mapper'

export const walletKeys = {
  all: ['wallet'] as const,
  me: ['wallet', 'me'] as const,
  charge: (chargeId: string) => ['wallet', 'charge', chargeId] as const,
  charges: ['wallet', 'charges'] as const,
  chargesPage: (page: number) => ['wallet', 'charges', page] as const,
  transactions: ['wallet', 'transactions'] as const,
  transactionsPage: (page: number) => ['wallet', 'transactions', page] as const,
}

export function useWalletQuery() {
  return useQuery({
    queryKey: walletKeys.me,
    queryFn: () => walletApi.getMine(),
    select: (dto): Wallet => ({ balance: dto.balance }),
  })
}

/** 충전 내역 (최신순 20건씩, page는 0부터). 쪽을 넘기는 동안 앞 쪽을 보여 준다 */
export function useChargeHistoryQuery(page = 0) {
  return useQuery({
    queryKey: walletKeys.chargesPage(page),
    queryFn: () => walletApi.listCharges(page),
    select: (result) => ({ ...result, content: result.content.map(toCharge) }),
    placeholderData: keepPreviousData,
  })
}

/** 이용 내역 (최신순 50건씩, page는 0부터). 쪽을 넘기는 동안 앞 쪽을 보여 준다 */
export function useWalletTransactionsQuery(page = 0) {
  return useQuery({
    queryKey: walletKeys.transactionsPage(page),
    queryFn: () => walletApi.listTransactions(page),
    select: (result) => ({ ...result, content: result.content.map(toWalletTransaction) }),
    placeholderData: keepPreviousData,
  })
}
