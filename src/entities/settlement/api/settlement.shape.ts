import { arr, bool, nullable, num, obj, pageOf, str } from '@/shared/api'

const settlementFields = {
  settlementId: str,
  sellerId: str,
  period: obj({ periodStart: nullable(str), periodEnd: str }),
  itemCount: num,
  totalAmount: num,
  feeRate: num,
  feeAmount: num,
  payoutAmount: num,
  status: str,
  settledAt: str,
}

export const settlementTargetsShape = arr(
  obj({
    targetId: str,
    orderItemId: str,
    productName: str,
    amount: num,
    confirmedAt: str,
    settled: bool,
  }),
)
export const settlementPageShape = pageOf(obj(settlementFields))
export const settlementDetailShape = obj({
  ...settlementFields,
  items: arr(obj({ orderItemId: str, productName: str, amount: num, confirmedAt: str })),
})
export const settlementRunShape = obj({
  periodEnd: str,
  settlementCount: num,
  settlements: arr(obj(settlementFields)),
})
