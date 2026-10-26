import { useState } from 'react'
import { useSearchParams } from 'react-router'
import {
  bulkTargets,
  countSellerOrdersByTab,
  filterSellerOrdersByTab,
  nextShippingStep,
  SELLER_ORDER_TABS,
  sellerOrderTabOf,
  useSellerOrdersQuery,
  type SellerOrderTab,
} from '@/entities/seller-order'
import { BulkShippingBar } from '@/features/ship-order'
import { getErrorMessage } from '@/shared/api'
import { sellerPathsOf } from '@/shared/config'
import { cn, useArea } from '@/shared/lib'
import { PageHeader } from '@/shared/ui/PageHeader'
import { ListSkeleton } from '@/shared/ui/Skeleton'
import { StateMessage } from '@/shared/ui/StateMessage'
import { SellerOrderTable } from './SellerOrderTable'

/** 주문 · 배송: 배송 상태 탭 → 고르기 · 일괄 처리 → 판매 주문 표 (발송은 상세에서) */
export function CenterOrdersPage() {
  const sellerPaths = sellerPathsOf(useArea())
  const orders = useSellerOrdersQuery()
  // 탭은 주소(?tab=)에 둔다 → 홈 할 일에서 바로 열린다
  const [params, setParams] = useSearchParams()
  const tab = sellerOrderTabOf(params.get('tab'))
  const setTab = (next: SellerOrderTab) =>
    setParams(next === 'ALL' ? {} : { tab: next }, { replace: true })
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const all = orders.data?.content ?? []
  const counts = countSellerOrdersByTab(all)
  const visible = filterSellerOrdersByTab(all, tab)
  const actionable = visible.filter((order) => nextShippingStep(order) !== null)
  const targets = bulkTargets(visible, selected)
  const chosen = targets.toShip.length + targets.toDeliver.length
  const allChosen = actionable.length > 0 && actionable.every((order) => selected.has(order.id))

  const toggle = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  return (
    <div className="shop-look space-y-5">
      <PageHeader
        title="주문 · 배송"
        step="⑤"
        description="결제된 주문을 발송하고 배송 완료로 바꿔요. 여러 건을 골라 한 번에 처리할 수 있어요."
        note="결제 완료된 주문 중 내 몫만 보여요. 송장을 넣어 발송하고 배송 완료로 바꿔요."
      />
      <div
        role="tablist"
        aria-label="배송 상태"
        className="border-rule flex gap-6 overflow-x-auto border-b"
      >
        {SELLER_ORDER_TABS.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={tab === item.value}
            onClick={() => {
              setTab(item.value)
              setSelected(new Set())
            }}
            className={cn(
              '-mb-px flex min-h-11 shrink-0 items-center gap-1.5 border-b-2 text-[15px] font-bold transition-colors',
              tab === item.value
                ? 'border-ink text-ink'
                : 'text-ink-3 hover:text-ink active:text-ink border-transparent',
            )}
          >
            {item.label} <span className="figure text-sm">{counts[item.value]}</span>
          </button>
        ))}
      </div>
      {actionable.length > 0 && (
        <label className="flex min-h-11 w-fit cursor-pointer items-center gap-2 text-sm lg:min-h-8">
          <input
            type="checkbox"
            className="accent-primary size-4"
            checked={allChosen}
            onChange={() =>
              setSelected(allChosen ? new Set() : new Set(actionable.map((order) => order.id)))
            }
          />
          처리할 주문 전체 선택{' '}
          <span className="text-ink-3 figure">
            ({chosen}/{actionable.length})
          </span>
        </label>
      )}
      {chosen > 0 && (
        <BulkShippingBar
          toShip={targets.toShip}
          toDeliver={targets.toDeliver}
          onDone={() => setSelected(new Set())}
        />
      )}
      {orders.isPending && <ListSkeleton />}
      {orders.isError && <StateMessage tone="error">{getErrorMessage(orders.error)}</StateMessage>}
      {orders.data && visible.length === 0 && (
        <p className="bg-paper-2 text-ink-2 rounded-lg py-12 text-center text-sm">
          {tab === 'ALL' ? '판매 주문이 없어요.' : '이 상태의 판매 주문이 없어요.'}
        </p>
      )}
      {visible.length > 0 && (
        <SellerOrderTable
          orders={visible}
          selected={selected}
          onToggle={toggle}
          orderHref={sellerPaths.order}
          listSearch={params.toString()}
        />
      )}
    </div>
  )
}
