import { useState } from 'react'
import { Link } from 'react-router'
import {
  childPurchaseSourceOf,
  childPurchaseStatusLabel,
  useChildPurchasesQuery,
} from '@/entities/order'
import { ProductImage } from '@/entities/product'
import { useChildWishRequestsQuery } from '@/entities/wish'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { formatDateTime } from '@/shared/lib'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Pagination } from '@/shared/ui/Pagination'
import { StateMessage } from '@/shared/ui/StateMessage'

/** 자녀가 보는 나를 위해 산 상품: 최신순, 출처는 내 조르기의 결제된 주문상품으로 판단 */
export function ChildPurchasesPage() {
  const [page, setPage] = useState(0)
  const purchases = useChildPurchasesQuery(page)
  const wishes = useChildWishRequestsQuery()
  return (
    <section className="space-y-6">
      <PageHeader
        title="나를 위해 산 것"
        description="보호자가 나를 위해 산 옷이에요. 최근에 산 것부터 보여요."
      />
      {purchases.isPending && <StateMessage>불러오는 중</StateMessage>}
      {purchases.isError && (
        <StateMessage tone="error">{getErrorMessage(purchases.error)}</StateMessage>
      )}
      {purchases.data?.content.length === 0 && (
        <div className="bg-paper-2 space-y-2 p-8 text-center">
          <p className="font-semibold">아직 나를 위해 산 상품이 없어요</p>
          <p className="text-ink-2 text-[13px]">보호자가 조르기를 결제하면 여기에 모여요.</p>
          <Link to={paths.child.wishes} className="shop-link text-sm">
            내 조르기 보기
          </Link>
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        {purchases.data?.content.map((item) => (
          <article key={item.id} className="border-ink flex gap-4 border-[1.5px] p-4">
            {/* 주문 당시 사진 (BE #1328 thumbnailUrl, 없으면 기본 이미지) */}
            <ProductImage
              src={item.thumbnailUrl}
              alt={item.productName}
              className="bg-paper-2 size-20 shrink-0 object-cover"
            />
            <div className="min-w-0 space-y-1">
              <p className="font-semibold">{item.productName}</p>
              <p className="text-ink-2 text-sm">
                {[item.optionName, `${item.quantity}개`].filter(Boolean).join(' · ')}
              </p>
              <p className="text-sm">
                {formatDateTime(item.orderedAt)} · {childPurchaseStatusLabel(item.status)}
                {wishes.data && ` · ${childPurchaseSourceOf(item.id, wishes.data)}`}
              </p>
            </div>
          </article>
        ))}
      </div>
      {purchases.data && (
        <Pagination page={page} totalPages={purchases.data.totalPages} onChange={setPage} />
      )}
    </section>
  )
}
