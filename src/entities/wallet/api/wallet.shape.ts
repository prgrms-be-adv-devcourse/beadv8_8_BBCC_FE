import { nullable, num, obj, oneOf, pageOf, str } from '@/shared/api'

export const walletShape = obj({ balance: num })

export const chargeShape = obj({
  chargeId: num,
  orderId: str,
  amount: num,
  status: oneOf(['PENDING', 'CONFIRMING', 'DONE', 'CANCELLING', 'CANCELLED', 'FAILED', 'EXPIRED']),
  approvedAt: nullable(str),
  createdAt: str,
})

export const chargeRequestShape = obj({ chargeId: num, orderId: str, amount: num, expiresAt: str })

export const chargeConfirmShape = obj({
  chargeId: num,
  status: str,
  amount: num,
  balance: nullable(num),
})

export const chargeCancelShape = obj({
  chargeId: num,
  status: str,
  amount: num,
  balance: nullable(num),
})

export const walletLedgerPageShape = pageOf(
  obj({
    ledgerId: num,
    type: oneOf([
      'CHARGE',
      'CHARGE_CANCEL',
      'CHARGE_CANCEL_REVERT',
      'PAYMENT',
      'REFUND',
      'SETTLEMENT',
    ]),
    amount: num,
    balanceAfter: num,
    refId: nullable(num),
    createdAt: str,
  }),
)
export const chargePageShape = pageOf(chargeShape)
