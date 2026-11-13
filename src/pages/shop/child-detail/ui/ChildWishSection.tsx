import { Link } from 'react-router'
import {
  ProductImage,
  lineImageUrl,
  productIdsWithoutImage,
  useProductImageUrls,
} from '@/entities/product'
import {
  countPendingWishes,
  filterWishes,
  useWishRequestsQuery,
  wishDeadlineLabel,
  wishTitle,
  wishTotalAmount,
} from '@/entities/wish'
import { getErrorMessage } from '@/shared/api'
import { memberPathsOf } from '@/shared/config'
import { formatWon, useArea } from '@/shared/lib'
import { StateMessage } from '@/shared/ui/StateMessage'

type ChildWishSectionProps = { childId: string; childName: string }

/** 자녀 프로필의 「○○의 조르기」: 답을 기다리는 조르기를 바로 열고, 전체는 받은 조르기에서 */
export function ChildWishSection({ childId, childName }: ChildWishSectionProps) {
  const paths = memberPathsOf(useArea())
  const wishes = useWishRequestsQuery(childId)
  const waiting = filterWishes(wishes.data ?? [], 'WAITING')
  const images = useProductImageUrls(
    productIdsWithoutImage(waiting.flatMap((wish) => wish.items.slice(0, 1))),
  )
  return (
    <section
      aria-label={`${childName}의 조르기`}
      className="border-rule space-y-3 rounded-lg border p-4 md:p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-section">
          {childName}의 조르기
          {wishes.data && (
            <span className="text-signal figure ml-2 text-sm">
              {countPendingWishes(wishes.data) || ''}
            </span>
          )}
        </h2>
        <Link to={paths.childWishes(childId)} className="shop-link text-sm font-semibold">
          전체 보기 ›
        </Link>
      </div>
      {wishes.isError && <StateMessage tone="error">{getErrorMessage(wishes.error)}</StateMessage>}
      {wishes.data && waiting.length === 0 && (
        <p className="text-ink-3 text-sm">답을 기다리는 조르기가 없어요.</p>
      )}
      {waiting.map((wish) => {
        const first = wish.items[0]
        return (
          <Link
            key={wish.requestId}
            to={paths.childWish(childId, wish.requestId)}
            className="bg-signal-soft flex items-center gap-3 rounded-lg p-3"
          >
            <span className="rounded-card block aspect-square w-12 shrink-0 overflow-hidden bg-white">
              {first && (
                <ProductImage
                  src={lineImageUrl(first, images)}
                  alt={first.productName}
                  className="size-full object-cover"
                />
              )}
            </span>
            <span className="min-w-0 flex-1 space-y-0.5">
              <span className="block text-sm font-semibold">
                {wishTitle(wish)} ·{' '}
                <span className="figure">{formatWon(wishTotalAmount(wish))}</span>
              </span>
              <span className="text-signal block text-xs font-semibold">
                답을 기다려요{wishDeadlineLabel(wish) && ` · ${wishDeadlineLabel(wish)}`}
              </span>
            </span>
            <span aria-hidden className="text-signal text-lg">
              ›
            </span>
          </Link>
        )
      })}
    </section>
  )
}
