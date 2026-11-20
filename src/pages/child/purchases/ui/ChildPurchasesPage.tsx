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
import { cn } from '@/shared/lib'
import { Pagination } from '@/shared/ui/Pagination'
import { StateMessage } from '@/shared/ui/StateMessage'

/** 사진을 붙인 것처럼 칸마다 조금씩 기울인다 (올리면 바로 선다, 움직임을 줄이면 기울기만) */
const TILTS = ['-rotate-[1.6deg]', 'rotate-[1.2deg]', '-rotate-[0.6deg]']

/** 자녀가 보는 사 준 옷: 최신순 폴라로이드, 조르기로 받은 것인지는 내 조르기의 결제된 주문상품으로 판단 */
export function ChildPurchasesPage() {
  const [page, setPage] = useState(0)
  const purchases = useChildPurchasesQuery(page)
  const wishes = useChildWishRequestsQuery()
  const total = purchases.data?.totalElements ?? 0
  return (
    <section className="flex flex-col gap-8 md:gap-11">
      <div className="border-ink flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b-[3px] pb-4 md:pb-5">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-[36px] leading-none md:text-[64px]">사 준 옷</h1>
          <p className="font-hand text-[19px] md:text-2xl">보호자가 나를 위해 사 준 옷이야</p>
        </div>
        {total > 0 && (
          <span className="bg-marker border-ink font-hand rotate-2 border-[1.5px] px-3.5 py-0.5 text-xl font-bold md:text-2xl">
            <span className="hidden md:inline">지금까지 </span>
            {total}벌!
          </span>
        )}
      </div>
      {purchases.isPending && <StateMessage>불러오는 중</StateMessage>}
      {purchases.isError && (
        <StateMessage tone="error">{getErrorMessage(purchases.error)}</StateMessage>
      )}
      {purchases.data?.content.length === 0 && (
        <div className="bg-paper-2 flex flex-col items-center gap-2.5 p-8 text-center md:p-12">
          <p className="font-display text-[26px]">아직 사 준 옷이 없어</p>
          <p className="text-[15px]">보호자가 조르기를 사 주면 여기에 모여.</p>
          <Link
            to={paths.child.wishes}
            className="text-ink flex min-h-11 items-center font-bold underline underline-offset-4"
          >
            내 조르기 보기 <span aria-hidden>&nbsp;→</span>
          </Link>
        </div>
      )}
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 px-1 pt-2 sm:grid-cols-[repeat(auto-fill,minmax(240px,1fr))] md:gap-x-8 md:gap-y-10">
        {purchases.data?.content.map((item, index) => (
          <article
            key={item.id}
            className={cn(
              'border-ink bg-paper relative flex flex-col gap-2.5 border-[1.5px] px-2.5 pt-2.5 pb-4 md:px-3.5 md:pt-3.5 md:pb-5',
              'motion-safe:transition-transform motion-safe:duration-200 motion-safe:hover:-translate-y-1 motion-safe:hover:rotate-0',
              TILTS[index % TILTS.length],
            )}
          >
            <span
              aria-hidden
              className="border-ink/25 absolute -top-2.5 left-1/2 h-[18px] w-14 -translate-x-1/2 -rotate-[4deg] border bg-[color-mix(in_oklab,var(--shop-marker)_75%,transparent)] md:-top-3 md:h-6 md:w-[84px]"
            />
            {/* 주문 당시 사진 (BE #1328 thumbnailUrl, 없으면 기본 이미지) */}
            <ProductImage
              src={item.thumbnailUrl}
              alt={item.productName}
              className="bg-paper-2 aspect-square w-full object-cover"
            />
            {wishes.data && (
              <p className="font-hand text-[17px] leading-tight font-bold md:text-[22px]">
                {childPurchaseSourceOf(item.id, wishes.data)}
              </p>
            )}
            <div className="border-ink flex flex-col gap-0.5 border-t-[1.5px] border-dashed pt-2.5">
              <p className="text-[13px] font-bold md:text-base">{item.productName}</p>
              <p className="text-[11px] md:text-[13px]">
                {[item.optionName, `${item.quantity}개`].filter(Boolean).join(' · ')}
              </p>
              <p className="font-label mt-1 text-xs font-bold tracking-[0.04em] md:text-[13px]">
                {item.orderedAt.slice(0, 10).replaceAll('-', '.')} 주문 ·{' '}
                {childPurchaseStatusLabel(item.status)}
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
