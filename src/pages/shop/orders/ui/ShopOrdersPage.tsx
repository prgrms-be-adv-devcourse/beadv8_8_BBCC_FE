import { Link, useSearchParams } from 'react-router'
import {
  ORDER_TABS,
  orderStatusOfTab,
  orderTabOf,
  OrderStatusBadge,
  useOrdersQuery,
  useOrderTabCountsQuery,
  type OrderTab,
} from '@/entities/order'
import {
  lineImageUrl,
  ProductImage,
  productIdsWithoutImage,
  useProductImageUrls,
} from '@/entities/product'
import { getErrorMessage, pageFromSearch } from '@/shared/api'
import { paths } from '@/shared/config'
import { cn, formatDateTime, formatWon } from '@/shared/lib'
import { Pagination } from '@/shared/ui/Pagination'
import { ListSkeleton } from '@/shared/ui/Skeleton'
import { StateMessage } from '@/shared/ui/StateMessage'

/** 내 주문 (기획서 F08): 상태 탭 → 주문 카드 → 주문 상세 */
export function ShopOrdersPage() {
  // 탭 · 페이지는 주소(?tab= · ?page=)에 둔다 → 마이페이지 요약에서 바로 열고, 상세에서 뒤로 와도 그대로
  const [params, setParams] = useSearchParams()
  const tab = orderTabOf(params.get('tab'))
  const page = pageFromSearch(params.get('page'))
  // 탭은 서버가 거른다 (BE #1280). 건수는 탭마다 size 1 요청의 전체 건수
  const orders = useOrdersQuery(page, orderStatusOfTab(tab))
  const counts = useOrderTabCountsQuery()
  const setTab = (next: OrderTab) =>
    setParams(next === 'ALL' ? {} : { tab: next }, { replace: true })
  const setPage = (next: number) => {
    const search = new URLSearchParams(params)
    if (next > 0) search.set('page', String(next))
    else search.delete('page')
    setParams(search, { replace: true })
  }
  const visible = orders.data?.content ?? []
  // 대표 사진: 응답 사진(BE #1328), 없는 옛 주문만 상품 상세 대표 사진으로
  const images = useProductImageUrls(productIdsWithoutImage(visible))

  return (
    <div className="shop-look space-y-6">
      <h1 className="text-page">주문 내역</h1>
      <div
        role="tablist"
        aria-label="주문 상태"
        className="border-rule flex gap-6 overflow-x-auto border-b"
      >
        {ORDER_TABS.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={tab === item.value}
            onClick={() => setTab(item.value)}
            className={cn(
              '-mb-px flex min-h-11 shrink-0 items-center gap-1.5 border-b-2 text-[15px] font-bold transition-colors',
              tab === item.value
                ? 'border-ink text-ink'
                : 'text-ink-3 hover:text-ink border-transparent',
            )}
          >
            {item.label} <span className="figure text-sm">{counts[item.value] ?? '…'}</span>
          </button>
        ))}
      </div>
      {orders.isPending && <ListSkeleton />}
      {orders.isError && <StateMessage tone="error">{getErrorMessage(orders.error)}</StateMessage>}
      {orders.data && visible.length === 0 && (
        <div className="bg-paper-2 rounded-card space-y-3 py-16 text-center">
          <p className="text-ink-2 text-base">
            {tab === 'ALL' ? '주문한 상품이 없어요.' : '이 상태의 주문이 없어요.'}
          </p>
          {tab === 'ALL' && (
            <Link to={paths.shop.home} className="shop-link">
              상품 보러 가기
            </Link>
          )}
        </div>
      )}
      {visible.length > 0 && (
        <ul className="divide-rule border-rule divide-y border-b">
          {visible.map((order) => (
            <li key={order.id}>
              <Link
                to={paths.shop.order(order.id)}
                className="hover:bg-paper-2 -mx-4 grid gap-x-6 gap-y-2 px-4 py-5 transition-colors md:grid-cols-[minmax(0,1fr)_auto_auto_auto] md:items-center"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <ProductImage
                    src={lineImageUrl(order, images)}
                    alt={order.title ?? `주문번호 ${order.id}`}
                    className="rounded-card aspect-[3/4] w-14 shrink-0"
                  />
                  <div className="min-w-0 space-y-1">
                    <p className="text-ink-3 flex flex-wrap gap-x-3 text-[13px]">
                      <span>{formatDateTime(order.orderedAt)}</span>
                      <span>주문번호 {order.id}</span>
                    </p>
                    <p className="text-[15px] font-semibold">
                      {order.title ?? `주문번호 ${order.id}`}
                    </p>
                  </div>
                </div>
                <span className="figure font-bold">{formatWon(order.totalAmount)}</span>
                <OrderStatusBadge status={order.status} />
                <span className="text-ink-3 text-[13px] font-semibold">상세</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {orders.data && (
        <Pagination
          page={orders.data.page}
          totalPages={orders.data.totalPages}
          onChange={setPage}
        />
      )}
    </div>
  )
}
