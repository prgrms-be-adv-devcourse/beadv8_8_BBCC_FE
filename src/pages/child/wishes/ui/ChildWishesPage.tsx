import { useState } from 'react'
import { Link } from 'react-router'
import {
  ProductImage,
  lineImageUrl,
  productIdsWithoutImage,
  useProductImageUrls,
} from '@/entities/product'
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
import { paths } from '@/shared/config'
import { cn } from '@/shared/lib'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StateMessage } from '@/shared/ui/StateMessage'

const FILTERS = Object.keys(WISH_FILTER_LABEL) as WishFilter[]
const EMPTY: Record<WishFilter, string> = {
  ALL: '보낸 조르기가 없어요',
  WAITING: '기다리는 조르기가 없어요',
  DONE: '끝난 조르기가 없어요',
}

/** 자녀가 보낸 조르기: 상태로 거르기 → 카드(사진 · 상태 · 남은 기간 · 합계 · 메시지 · 철회) */
export function ChildWishesPage() {
  const wishes = useChildWishRequestsQuery()
  const [filter, setFilter] = useState<WishFilter>('ALL')
  const all = wishes.data ?? []
  const images = useProductImageUrls(productIdsWithoutImage(all.flatMap((wish) => wish.items)))
  const shown = filterWishes(all, filter)
  return (
    <section className="space-y-6">
      <PageHeader title="내 조르기" description="보호자에게 보낸 조르기와 결과를 봐요." />
      {wishes.data && (
        <div role="group" aria-label="조르기 거르기" className="flex flex-wrap gap-2">
          {FILTERS.map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={filter === key}
              onClick={() => setFilter(key)}
              className={cn(
                'border-ink inline-flex min-h-10 items-center border-[1.5px] px-4 text-sm font-bold',
                filter === key ? 'bg-ink text-paper' : 'text-ink hover:bg-marker',
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
      {wishes.data && shown.length === 0 && (
        <div className="bg-paper-2 space-y-2 p-8 text-center">
          <p className="font-semibold">{EMPTY[filter]}</p>
          <p className="text-ink-2 text-[13px]">
            내 장바구니에서 옷을 골라 보호자에게 조를 수 있어요.
          </p>
          <Link to={paths.child.cart} className="shop-link text-sm">
            내 장바구니 보기
          </Link>
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        {shown.map((wish) => (
          <WishSummaryCard
            key={wish.requestId}
            wish={wish}
            statusLabel={childWishStatusLabel(wish)}
            renderImage={(line) => (
              <ProductImage
                src={lineImageUrl(line, images)}
                alt={line.productName}
                className="size-full object-cover"
              />
            )}
            action={<WithdrawChildWishButton wish={wish} />}
          />
        ))}
      </div>
    </section>
  )
}
