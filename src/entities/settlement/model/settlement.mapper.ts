import type {
  SettlementDetailDto,
  SettlementDto,
  SettlementRunResultDto,
  SettlementTargetDto,
} from '../api/settlement.dto'
import type {
  Settlement,
  SettlementDetail,
  SettlementRunResult,
  SettlementStatus,
  SettlementTarget,
} from './settlement'

export function toSettlementTarget(dto: SettlementTargetDto): SettlementTarget {
  return {
    id: dto.targetId,
    productName: dto.productName,
    amount: dto.amount,
    confirmedAt: dto.confirmedAt,
    settled: dto.settled,
  }
}

export function toSettlement(dto: SettlementDto): Settlement {
  return {
    id: dto.settlementId,
    sellerId: dto.sellerId,
    status: dto.status as SettlementStatus,
    periodEnd: dto.period.periodEnd,
    itemCount: dto.itemCount,
    totalAmount: dto.totalAmount,
    feeRatePercent: Math.round(dto.feeRate * 100),
    feeAmount: dto.feeAmount,
    payoutAmount: dto.payoutAmount,
  }
}

export function toSettlementDetail(dto: SettlementDetailDto): SettlementDetail {
  return { ...toSettlement(dto), items: dto.items }
}

export function toSettlementRunResult(dto: SettlementRunResultDto): SettlementRunResult {
  return { settlementCount: dto.settlementCount, settlements: dto.settlements.map(toSettlement) }
}
