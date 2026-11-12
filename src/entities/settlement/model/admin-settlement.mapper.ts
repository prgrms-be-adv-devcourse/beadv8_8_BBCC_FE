import type { AdminSettlementDto } from '../api/admin-settlement.dto'
import type { AdminSettlement } from './admin-settlement'
import { toSettlement } from './settlement.mapper'

export function toAdminSettlement(dto: AdminSettlementDto): AdminSettlement {
  return { ...toSettlement(dto), sellerId: String(dto.sellerId), failReason: dto.failReason }
}
