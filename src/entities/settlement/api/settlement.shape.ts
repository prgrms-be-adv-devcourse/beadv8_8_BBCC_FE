import { arr, nullable, num, obj, oneOf, pageOf, str } from '@/shared/api'

const STATUS = oneOf(['COMPLETED', 'PAID', 'FAILED'])

const settlementFields = {
  settlementId: num,
  periodStartOn: str,
  periodEndOn: str,
  totalSalesAmount: num,
  feeRate: num,
  feeAmount: num,
  settlementAmount: num,
  status: STATUS,
  completedAt: nullable(str),
  paidAt: nullable(str),
}

const itemFields = { orderItemId: num, orderId: num, salesAmount: num, confirmedAt: str }

export const settlementTargetPageShape = pageOf(obj(itemFields))
export const settlementPageShape = pageOf(obj(settlementFields))
export const settlementDetailShape = obj({
  ...settlementFields,
  failReason: nullable(str),
  items: arr(obj(itemFields)),
})
export const settlementRunShape = obj({
  runId: num,
  cutoffAt: str,
  periodStartOn: str,
  periodEndOn: str,
  triggerType: str,
  status: oneOf(['RUNNING', 'COMPLETED', 'PARTIAL_FAILED', 'FAILED']),
  successCount: num,
  failCount: num,
  requestedBy: nullable(num),
  startedAt: str,
  finishedAt: nullable(str),
})
