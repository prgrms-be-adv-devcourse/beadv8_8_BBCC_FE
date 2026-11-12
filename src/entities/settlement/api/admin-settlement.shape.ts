import { nullable, num, obj, pageOf, str } from '@/shared/api'
import { settlementFields } from './settlement.shape'

export const adminSettlementPageShape = pageOf(
  obj({ ...settlementFields, sellerId: num, failReason: nullable(str) }),
)
