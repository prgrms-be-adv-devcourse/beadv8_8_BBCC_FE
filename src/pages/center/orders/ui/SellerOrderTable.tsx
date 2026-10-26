import { Link } from 'react-router'
import { nextShippingStep, type SellerOrder } from '@/entities/seller-order'
import { carrierName, DELIVERY_STATUS_LABEL } from '@/shared/config'
import { cn, formatDateTime } from '@/shared/lib'

type SellerOrderTableProps = {
  orders: SellerOrder[]
  selected: Set<string>
  onToggle: (id: string) => void
  orderHref: (id: string) => string
  /** 상세에서 목록으로 돌아올 때 지금 탭을 되살린다 */
  listSearch: string
}

type CellLabelProps = { children: string }

/** 휴대폰에서 칸 앞에 붙이는 라벨 (넓은 화면은 표 머리가 대신한다) */
function CellLabel({ children }: CellLabelProps) {
  return <span className="text-ink-3 text-[13px] lg:hidden">{children}</span>
}

// 휴대폰: 행을 묶음으로 다시 쌓는다. 첫 줄은 고르기 · 판매 주문 · 배송 상태, 그 아래 라벨 붙은 칸
const stackedCell =
  'max-lg:col-span-2 max-lg:col-start-2 max-lg:grid max-lg:grid-cols-[4.5rem_minmax(0,1fr)] max-lg:gap-2 max-lg:py-0.5'

/** 판매 주문 표: 고르기 · 판매 주문(상세 링크) · 상품 요약 · 받는 분 · 주문 시각 · 배송 상태 · 송장 */
export function SellerOrderTable({
  orders,
  selected,
  onToggle,
  orderHref,
  listSearch,
}: SellerOrderTableProps) {
  return (
    <div className="lg:overflow-x-auto">
      <table className="w-full text-left text-sm max-lg:block">
        <thead className="max-lg:hidden">
          <tr className="border-rule text-ink-3 border-b text-[13px]">
            <th scope="col" className="w-10 py-2.5 font-medium">
              <span className="sr-only">선택</span>
            </th>
            <th scope="col" className="py-2.5 pr-4 font-medium">
              판매 주문
            </th>
            <th scope="col" className="py-2.5 pr-4 font-medium">
              상품
            </th>
            <th scope="col" className="py-2.5 pr-4 font-medium">
              받는 분
            </th>
            <th scope="col" className="py-2.5 pr-4 font-medium">
              주문 시각
            </th>
            <th scope="col" className="py-2.5 pr-4 font-medium">
              배송 상태
            </th>
            <th scope="col" className="py-2.5 font-medium">
              송장
            </th>
          </tr>
        </thead>
        <tbody className="max-lg:block">
          {orders.map((order) => {
            const [first, ...rest] = order.items
            const summary = first
              ? `${first.productName}${rest.length > 0 ? ` 외 ${rest.length}건` : ''}`
              : '-'
            return (
              <tr
                key={order.id}
                className="border-rule border-b max-lg:grid max-lg:grid-cols-[2.75rem_minmax(0,1fr)_auto] max-lg:gap-x-2 max-lg:py-3 lg:align-middle"
              >
                <td className="py-3 max-lg:col-start-1 max-lg:row-start-1 max-lg:py-0">
                  <label className="flex size-11 cursor-pointer items-center justify-center lg:size-8 lg:justify-start">
                    <input
                      type="checkbox"
                      aria-label={`판매 주문 #${order.id} 선택`}
                      className="accent-primary size-4"
                      disabled={nextShippingStep(order) === null}
                      checked={selected.has(order.id)}
                      onChange={() => onToggle(order.id)}
                    />
                  </label>
                </td>
                <td className="py-3 pr-4 max-lg:col-start-2 max-lg:row-start-1 max-lg:self-center max-lg:py-0">
                  <Link
                    to={orderHref(order.id)}
                    state={{ listSearch }}
                    className="figure hover:text-signal inline-flex items-center font-semibold whitespace-nowrap underline-offset-4 transition-colors hover:underline max-lg:min-h-8"
                  >
                    판매 주문 #{order.id}
                  </Link>
                  <span className="text-ink-3 figure block text-[13px] whitespace-nowrap">
                    주문번호 {order.orderId}
                  </span>
                </td>
                <td className={cn('py-3 pr-4', stackedCell)}>
                  <CellLabel>상품</CellLabel>
                  <span className="block lg:max-w-60 lg:truncate" title={summary}>
                    {summary}
                  </span>
                </td>
                <td className={cn('py-3 pr-4 whitespace-nowrap', stackedCell)}>
                  <CellLabel>받는 분</CellLabel>
                  <span>{order.recipientName}</span>
                </td>
                <td className={cn('figure text-ink-2 py-3 pr-4 whitespace-nowrap', stackedCell)}>
                  <CellLabel>주문 시각</CellLabel>
                  <span>{formatDateTime(order.orderedAt)}</span>
                </td>
                <td className="py-3 pr-4 max-lg:col-start-3 max-lg:row-start-1 max-lg:self-center max-lg:py-0 max-lg:pr-0">
                  <span className="bg-paper-2 text-ink-2 inline-flex h-6 items-center rounded-sm px-2 text-xs font-semibold whitespace-nowrap">
                    {DELIVERY_STATUS_LABEL[order.status]}
                  </span>
                </td>
                <td
                  className={cn(
                    'figure text-ink-2 py-3 text-[13px]',
                    stackedCell,
                    !order.trackingNumber && 'max-lg:hidden',
                  )}
                >
                  <CellLabel>송장</CellLabel>
                  {order.trackingNumber ? (
                    <span>
                      {carrierName(order.carrier)} {order.trackingNumber}
                    </span>
                  ) : (
                    <span className="text-ink-3">-</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
