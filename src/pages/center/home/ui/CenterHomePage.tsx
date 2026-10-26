import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { isOnSale, stockLevelOf, useSellerProductsQuery } from '@/entities/product'
import { sumSettlementItems, useSettlementTargetsQuery } from '@/entities/settlement'
import { SELLER_STATUS_LABEL, useMySellerQuery } from '@/entities/seller'
import { summarizeSellerOrders, useSellerOrdersQuery } from '@/entities/seller-order'
import { getErrorMessage } from '@/shared/api'
import { paths, sellerPathsOf } from '@/shared/config'
import { cn, formatWon, useArea } from '@/shared/lib'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StateMessage } from '@/shared/ui/StateMessage'

/**
 * 판매자 센터 첫 화면: 상점 한 줄(읽기 전용) → 오늘 할 일.
 * 발송할 주문을 가장 크게 두고, 나머지 수치는 주문 · 상품 · 정산 묶음으로 가는 실선 사이에 둔다.
 * 누르면 그 탭 · 거르기로 바로 (주소 ?tab= · ?stock=)
 */
export function CenterHomePage() {
  const sellerPaths = sellerPathsOf(useArea())
  const orders = useSellerOrdersQuery()
  const products = useSellerProductsQuery()
  const seller = useMySellerQuery()
  const summary = orders.data ? summarizeSellerOrders(orders.data.content) : null
  const targets = useSettlementTargetsQuery()
  const onSaleCount = products.data?.content.filter(isOnSale).length
  const lowStockCount = products.data?.content.filter(
    (product) => stockLevelOf(product.totalStock) !== 'OK',
  ).length
  const pendingSettlement = targets.data ? sumSettlementItems(targets.data.content) : undefined

  return (
    <div className="shop-look space-y-8">
      <PageHeader title="판매자 센터" description="주문을 발송하고, 상품과 정산을 관리해요." />

      {/* 상점 한 줄: 상호명 · 판매 상태는 읽기만, 바꾸는 일은 상점 정보에서 */}
      <section
        aria-label="내 상점"
        className="border-rule flex min-h-14 flex-wrap items-center gap-x-3 gap-y-1 border-b pb-3"
      >
        {seller.data ? (
          <>
            <p className="text-ink text-[15px] font-bold break-all">{seller.data.businessName}</p>
            <p
              className={cn(
                'text-[13px] font-semibold',
                seller.data.status === 'ACTIVE' ? 'text-signal' : 'text-destructive',
              )}
            >
              {SELLER_STATUS_LABEL[seller.data.status]}
            </p>
          </>
        ) : seller.isError ? (
          <StateMessage tone="error">{getErrorMessage(seller.error)}</StateMessage>
        ) : (
          <StateMessage>내 판매자 정보를 불러오는 중…</StateMessage>
        )}
        <Link
          to={paths.center.store}
          className="text-ink-2 hover:text-ink ml-auto inline-flex min-h-11 items-center text-[13px] font-semibold transition-colors"
        >
          상점 정보
        </Link>
      </section>

      <section aria-label="오늘 할 일" className="space-y-4">
        <h2 className="text-section">오늘 할 일</h2>

        {/* 시그니처: 발송할 주문 */}
        <Link
          to={`${sellerPaths.orders}?tab=READY`}
          className="border-rule hover:border-ink-3 flex items-end justify-between gap-6 rounded-lg border p-5 transition-colors md:p-6"
        >
          <span className="text-ink text-[15px] font-bold">발송할 주문</span>
          <span className="figure text-signal text-5xl leading-none font-bold tracking-tight">
            {summary?.toShip ?? '…'}
          </span>
        </Link>

        <div className="border-rule divide-rule grid divide-y border-y md:grid-cols-3 md:divide-x md:divide-y-0">
          <MetricGroup title="주문">
            <Metric
              to={`${sellerPaths.orders}?tab=SHIPPING`}
              label="배송 중"
              value={summary?.shipping}
            />
            <Metric
              to={`${sellerPaths.orders}?tab=DELIVERED`}
              label="배송 완료"
              value={summary?.delivered}
            />
          </MetricGroup>
          <MetricGroup title="상품">
            <Metric to={sellerPaths.products} label="판매 중 상품" value={onSaleCount} />
            <Metric
              to={`${sellerPaths.products}?stock=low`}
              label="재고 적은 상품"
              value={lowStockCount}
              flag={lowStockCount ? '확인 필요' : undefined}
            />
          </MetricGroup>
          <MetricGroup title="정산">
            <Metric
              to={sellerPaths.settlements}
              label="정산 예정 (구매확정분)"
              value={pendingSettlement === undefined ? undefined : formatWon(pendingSettlement)}
            />
            <p className="text-ink-3 col-span-2 text-[13px]">
              구매확정된 판매 금액은 월 정산 때 수수료를 빼고 지갑에 적립돼요.{' '}
              <Link to={sellerPaths.settlements} className="shop-link">
                정산 보기
              </Link>
            </p>
          </MetricGroup>
        </div>
      </section>
    </div>
  )
}

type MetricGroupProps = { title: string; children: ReactNode }

/** 관심사 묶음 하나 (주문 · 상품 · 정산) */
function MetricGroup({ title, children }: MetricGroupProps) {
  return (
    <div className="space-y-2 py-4 md:px-5 md:first:pl-0 md:last:pr-0">
      <h3 className="text-ink-3 text-[13px] font-semibold">{title}</h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">{children}</div>
    </div>
  )
}

type MetricProps = {
  to: string
  label: string
  /** 아직 불러오지 못했으면 undefined (「…」) */
  value: number | string | undefined
  /** 값 옆 주의 꼬리표 (예: 재고 적은 상품이 있을 때) */
  flag?: string
}

/** 수치 하나: 라벨 · 값, 누르면 그 화면으로. 0이면 흐리게 */
function Metric({ to, label, value, flag }: MetricProps) {
  const isEmpty = value === undefined || value === 0
  return (
    <Link
      to={to}
      className="group hover:bg-paper-2 -mx-2 flex min-h-11 flex-col justify-center rounded-md px-2 py-1.5 transition-colors"
    >
      <span className="text-ink-2 text-[13px]">{label}</span>
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className={cn('figure text-xl font-bold', isEmpty ? 'text-ink-3' : 'text-ink')}>
          {value ?? '…'}
        </span>
        {flag && (
          <span className="bg-paper-2 text-ink group-hover:bg-paper-3 inline-flex h-6 items-center rounded-sm px-2 text-xs font-bold">
            {flag}
          </span>
        )}
      </span>
    </Link>
  )
}
