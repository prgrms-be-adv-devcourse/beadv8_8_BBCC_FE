import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  adminWalletApi,
  adminWalletKeys,
  toBalanceReturn,
  toReturnBalanceRequest,
  type AdminWallet,
} from '@/entities/wallet'
import { getErrorStatus, runWithAction } from '@/shared/api'

/**
 * 잔액 돌려주기: 시스템 밖에서 돌려준 뒤 기록하고 잔액을 0으로 만든다 (실제 송금은 하지 않음).
 * 성공하면 목록을 다시 받는다. 409(동결 아님 · 그사이 잔액이 바뀜)도 목록을 다시 받아 사용자가 지금 잔액을 보고 다시 누르게 한다 (자동 재요청 없음)
 */
export function useReturnWalletBalance() {
  const queryClient = useQueryClient()
  const refetchWallets = () => queryClient.invalidateQueries({ queryKey: adminWalletKeys.all })
  return useMutation({
    mutationFn: (wallet: AdminWallet) =>
      runWithAction('지갑 잔액 돌려주기', () =>
        adminWalletApi.returnBalance(wallet.id, toReturnBalanceRequest(wallet)),
      ).then(toBalanceReturn),
    onSuccess: () => refetchWallets(),
    onError: (error) => {
      if (getErrorStatus(error) === 409) void refetchWallets()
    },
  })
}
