import { useState } from 'react'
import { ProductImage, useProductImageUrls } from '@/entities/product'
import {
  childWishStatusLabel,
  filterWishes,
  useChildWishRequestsQuery,
  WISH_FILTER_LABEL,
  WishSummaryCard,
  type WishFilter,
} from '@/entities/wish'
import { WithdrawChildWishButton } from '@/features/withdraw-child-wish'
import { getErrorMessage } from '@/shared/api'
import { cn } from '@/shared/lib'
import { StateMessage } from '@/shared/ui/StateMessage'

const FILTERS = Object.keys(WISH_FILTER_LABEL) as WishFilter[]
const EMPTY: Record<WishFilter, string> = {
  ALL: '보낸 조르기가 없어요.',
  WAITING: '기다리는 조르기가 없어요.',
  DONE: '끝난 조르기가 없어요.',
}

/** 자녀가 보낸 조르기: 상태로 거르기 → 카드(사진 · 상태 · 남은 기간 · 합계 · 메시지 · 철회) */
export function ChildWishesPage() {
  const wishes = useChildWishRequestsQuery()
  const [filter, setFilter] = useState<WishFilter>('ALL')
  const all = wishes.data ?? []
  const images = useProductImageUrls(
    all.flatMap((wish) => wish.items.map((item) => item.productId)),
  )
  const shown = filterWishes(all, filter)
  return (
    <section className="mx-auto max-w-2xl space-y-4 p-4 md:p-6">
      <h1 className="text-page">내 조르기</h1>
      {wishes.data && (
        <div role="group" aria-label="조르기 거르기" className="flex flex-wrap gap-2">
          {FILTERS.map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={filter === key}
              onClick={() => setFilter(key)}
              className={cn(
                'inline-flex min-h-10 items-center rounded-full border px-4 text-sm font-semibold',
                filter === key ? 'border-ink bg-ink text-white' : 'border-rule text-ink-2',
              )}
            >
              {WISH_FILTER_LABEL[key]}{' '}
              <span className="figure ml-1">{filterWishes(all, key).length}</span>
            </button>
          ))}
        </div>
      )}
      {wishes.isPending && <StateMessage>불러오는 중</StateMessage>}
      {wishes.isError && <StateMessage tone="error">{getErrorMessage(wishes.error)}</StateMessage>}
      {wishes.data && shown.length === 0 && <StateMessage>{EMPTY[filter]}</StateMessage>}
      {shown.map((wish) => (
        <WishSummaryCard
          key={wish.requestId}
          wish={wish}
          statusLabel={childWishStatusLabel(wish)}
          renderImage={(line) => (
            <ProductImage
              src={line.productId ? (images[line.productId] ?? null) : null}
              alt={line.productName}
              className="size-full object-cover"
            />
          )}
          action={<WithdrawChildWishButton wish={wish} />}
        />
      ))}
    </section>
  )
}
