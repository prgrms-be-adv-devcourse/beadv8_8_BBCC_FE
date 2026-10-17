import { useState } from 'react'
import { useSearchParams } from 'react-router'
import {
  bulkTargets,
  countSellerOrdersByTab,
  filterSellerOrdersByTab,
  nextShippingStep,
  SELLER_ORDER_TABS,
  SellerOrderCard,
  sellerOrderTabOf,
  useSellerOrdersQuery,
  type SellerOrderTab,
} from '@/entities/seller-order'
import { BulkShippingBar, ShipOrderControls } from '@/features/ship-order'
import { getErrorMessage } from '@/shared/api'
import { cn } from '@/shared/lib'
import { PageHeader } from '@/shared/ui/PageHeader'
import { ListSkeleton } from '@/shared/ui/Skeleton'
import { StateMessage } from '@/shared/ui/StateMessage'

export function CenterOrdersPage() {
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
    <div className="space-y-4">
      <PageHeader
        title="주문 · 배송"
        step="⑤"
        description="결제된 주문을 발송하고 배송 완료로 바꿔요. 여러 건을 골라 한 번에 처리할 수 있어요."
        note="결제 완료된 주문 중 내 몫만 보여요. 송장을 넣어 발송하고 배송 완료로 바꿔요."
      />
      <div role="tablist" aria-label="배송 상태" className="flex gap-2 overflow-x-auto">
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
              'shrink-0 rounded-full border px-3 py-1 text-sm',
              tab === item.value
                ? 'border-primary bg-primary text-primary-foreground'
                : 'hover:border-primary bg-white',
            )}
          >
            {item.label} <span className="font-bold">{counts[item.value]}</span>
          </button>
        ))}
      </div>
      {actionable.length > 0 && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="accent-primary size-4"
            checked={allChosen}
            onChange={() =>
              setSelected(allChosen ? new Set() : new Set(actionable.map((order) => order.id)))
            }
          />
          처리할 주문 전체 선택 ({chosen}/{actionable.length})
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
        <StateMessage>
          {tab === 'ALL' ? '판매 주문이 없어요.' : '이 상태의 판매 주문이 없어요.'}
        </StateMessage>
      )}
      {visible.map((order) => (
        <div key={order.id} className="flex items-start gap-3">
          <input
            type="checkbox"
            aria-label={`판매 주문 #${order.id} 선택`}
            className="accent-primary mt-5 size-4 shrink-0"
            disabled={nextShippingStep(order) === null}
            checked={selected.has(order.id)}
            onChange={() => toggle(order.id)}
          />
          <div className="min-w-0 flex-1">
            <SellerOrderCard order={order} action={<ShipOrderControls sellerOrder={order} />} />
          </div>
        </div>
      ))}
    </div>
  )
}
