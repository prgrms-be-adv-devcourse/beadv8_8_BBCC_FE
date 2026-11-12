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
  SettlementTarget,
  SettlementStatus,
} from './settlement'

export function toSettlementItem(dto: SettlementDetailDto['items'][number]): SettlementItem {
  return {
    orderItemId: String(dto.orderItemId),
    orderId: String(dto.orderId),
    amount: dto.salesAmount,
    confirmedAt: dto.confirmedAt,
  }
}

export function toSettlementTarget(dto: SettlementTargetDto): SettlementTarget {
  return { ...toSettlementItem(dto), expectedPayoutOn: dto.expectedPayoutOn }
}

export function toSettlement(dto: SettlementDto): Settlement {
  return {
    id: String(dto.settlementId),
    status: dto.status as SettlementStatus,
    periodStart: dto.periodStartOn,
    periodEnd: dto.periodEndOn,
    totalAmount: dto.totalSalesAmount,
    // 0.035 → 3.5 (BE는 소수점 넷째 자리까지라 퍼센트는 둘째 자리까지)
    feeRatePercent: Math.round(dto.feeRate * 10000) / 100,
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
    skippedSellers: dto.skippedSellers.map((seller) => ({
      ...seller,
      sellerId: String(seller.sellerId),
    })),
  }
}
