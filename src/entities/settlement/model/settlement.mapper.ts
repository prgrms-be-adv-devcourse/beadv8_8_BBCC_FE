import type {
  SettlementDetailDto,
  SettlementDto,
  SettlementRunResultDto,
  SettlementTargetDto,
} from '../api/settlement.dto'
import type {
  Settlement,
  SettlementDetail,
  SettlementItem,
  SettlementRunResult,
  SettlementStatus,
} from './settlement'

export function toSettlementItem(dto: SettlementTargetDto): SettlementItem {
  return {
    orderItemId: String(dto.orderItemId),
    orderId: String(dto.orderId),
    amount: dto.salesAmount,
    confirmedAt: dto.confirmedAt,
  }
}

export function toSettlement(dto: SettlementDto): Settlement {
  return {
    id: String(dto.settlementId),
    status: dto.status as SettlementStatus,
    periodStart: dto.periodStartOn,
    periodEnd: dto.periodEndOn,
    totalAmount: dto.totalSalesAmount,
    feeRatePercent: Math.round(dto.feeRate * 100),
    feeAmount: dto.feeAmount,
    payoutAmount: dto.settlementAmount,
    completedAt: dto.completedAt,
    paidAt: dto.paidAt,
  }
}

export function toSettlementDetail(dto: SettlementDetailDto): SettlementDetail {
  return {
    ...toSettlement(dto),
    failReason: dto.failReason,
    items: dto.items.map(toSettlementItem),
  }
}

export function toSettlementRunResult(dto: SettlementRunResultDto): SettlementRunResult {
  return {
    runId: String(dto.runId),
    status: dto.status,
    successCount: dto.successCount,
    failCount: dto.failCount,
    periodStart: dto.periodStartOn,
    periodEnd: dto.periodEndOn,
  }
}
