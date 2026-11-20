import { useState } from 'react'
import { Link } from 'react-router'
import { lineImageUrl, productIdsWithoutImage, useProductImageUrls } from '@/entities/product'
import {
  CHILD_WISH_FILTER_LABEL,
  CHILD_WISH_FILTERS,
  filterChildWishes,
  useChildWishRequestsQuery,
  type ChildWishFilter,
} from '@/entities/wish'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { cn } from '@/shared/lib'
import { StateMessage } from '@/shared/ui/StateMessage'
import { ChildWishCard } from './ChildWishCard'

/** 자녀가 보낸 조르기: 상태로 거르기 → 카드(도장 · 옷 · 내가 쓴 말 · 보호자 답 · 남은 기간 · 거두기) */
export function ChildWishesPage() {
  const wishes = useChildWishRequestsQuery()
  const [filter, setFilter] = useState<ChildWishFilter>('ALL')
  const all = wishes.data ?? []
  const images = useProductImageUrls(productIdsWithoutImage(all.flatMap((wish) => wish.items)))
  const shown = filterChildWishes(all, filter)
  return (
    <section className="flex flex-col gap-6 md:gap-7">
      <div className="border-ink flex flex-col gap-2 border-b-[3px] pb-4 md:pb-5">
        <h1 className="font-display text-[36px] leading-none md:text-[64px]">내 조르기</h1>
        <p className="font-hand text-[19px] md:text-2xl">
          <span className="hidden md:inline">보호자에게 </span>보낸 조르기와 답을 모아 봤어
        </p>
      </div>
      {wishes.data && (
        <div
          role="group"
          aria-label="조르기 상태로 보기"
          className="flex gap-1.5 max-md:-mr-4 max-md:overflow-x-auto max-md:pr-4 md:flex-wrap md:gap-2"
        >
          {CHILD_WISH_FILTERS.map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={filter === key}
              onClick={() => setFilter(key)}
              className={cn(
                'border-ink inline-flex min-h-11 shrink-0 items-center gap-2 border-2 px-3 text-sm font-bold whitespace-nowrap md:px-4 md:text-[15px]',
                filter === key ? 'bg-ink text-paper' : 'bg-paper text-ink hover:bg-marker',
              )}
            >
              {CHILD_WISH_FILTER_LABEL[key]}
              <span className="figure text-[13px]">{filterChildWishes(all, key).length}</span>
            </button>
          ))}
        </div>
      )}
      {wishes.isPending && <StateMessage>불러오는 중</StateMessage>}
      {wishes.isError && <StateMessage tone="error">{getErrorMessage(wishes.error)}</StateMessage>}
      {wishes.data && shown.length === 0 && (
        <div className="bg-paper-2 flex flex-col items-center gap-2.5 p-8 text-center md:p-12">
          <p className="font-display text-[26px]">여기엔 아직 없어</p>
          <Link
            to={paths.child.cart}
            className="text-ink flex min-h-11 items-center font-bold underline underline-offset-4"
          >
            장바구니로 가기 <span aria-hidden>&nbsp;→</span>
          </Link>
        </div>
      )}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,560px),1fr))] gap-4 md:gap-6">
        {shown.map((wish) => (
          <ChildWishCard
            key={wish.requestId}
            wish={wish}
            imageOf={(line) => lineImageUrl(line, images)}
          />
        ))}
      </div>
    </section>
  )
}
