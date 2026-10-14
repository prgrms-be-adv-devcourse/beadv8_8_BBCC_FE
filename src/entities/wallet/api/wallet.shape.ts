import { nullable, num, obj, oneOf, str } from '@/shared/api'

export const walletShape = obj({ balance: num })

export const chargeShape = obj({
  chargeId: num,
  orderId: str,
  amount: num,
  status: oneOf(['PENDING', 'CONFIRMING', 'DONE', 'CANCELLING', 'CANCELLED', 'FAILED', 'EXPIRED']),
  approvedAt: nullable(str),
})

export const chargeRequestShape = obj({ chargeId: num, orderId: str, amount: num, expiresAt: str })

export const chargeConfirmShape = obj({
  chargeId: num,
  status: str,
  amount: num,
  balance: nullable(num),
})
