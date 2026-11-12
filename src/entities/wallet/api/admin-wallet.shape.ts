import { nullable, num, obj, pageOf, str } from '@/shared/api'

export const adminWalletPageShape = pageOf(
  obj({ walletId: num, memberId: num, balance: num, frozenAt: nullable(str) }),
)

export const balanceReturnShape = obj({
  balanceReturnId: num,
  walletId: num,
  memberId: num,
  amount: num,
  balance: num,
  ledgerId: num,
  returnedAt: str,
})
