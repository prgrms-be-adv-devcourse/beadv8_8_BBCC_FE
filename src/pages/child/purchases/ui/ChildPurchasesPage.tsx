import { useState } from 'react'
import {
  childPurchaseSourceOf,
  childPurchaseStatusLabel,
  useChildPurchasesQuery,
} from '@/entities/order'
import { useChildWishRequestsQuery } from '@/entities/wish'
import { getErrorMessage } from '@/shared/api'
import { formatDateTime } from '@/shared/lib'
import { Pagination } from '@/shared/ui/Pagination'
import { StateMessage } from '@/shared/ui/StateMessage'

/** 자녀가 보는 나를 위해 산 상품: 최신순, 출처는 내 조르기의 결제된 주문상품으로 판단 */
export function ChildPurchasesPage() {
  const [page, setPage] = useState(0)
  const purchases = useChildPurchasesQuery(page)
  const wishes = useChildWishRequestsQuery()
  return (
    <section className="space-y-4">
      <h1>나를 위해 산 것</h1>
      {purchases.isPending && <StateMessage>불러오는 중</StateMessage>}
      {purchases.isError && (
        <StateMessage tone="error">{getErrorMessage(purchases.error)}</StateMessage>
      )}
      {purchases.data?.content.length === 0 && (
        <StateMessage>아직 나를 위해 산 상품이 없어요.</StateMessage>
      )}
      {purchases.data?.content.map((item) => (
        <article key={item.id} className="space-y-1 border p-4">
          <p className="font-semibold">{item.productName}</p>
          <p className="text-ink-2 text-sm">
            {[item.optionName, `${item.quantity}개`].filter(Boolean).join(' · ')}
          </p>
          <p className="text-sm">
            {formatDateTime(item.orderedAt)} · {childPurchaseStatusLabel(item.status)}
            {wishes.data && ` · ${childPurchaseSourceOf(item.id, wishes.data)}`}
          </p>
        </article>
      ))}
      {purchases.data && (
        <Pagination page={page} totalPages={purchases.data.totalPages} onChange={setPage} />
      )}
    </section>
  )
}
