import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { useChildrenQuery } from '@/entities/child'
import {
  ProductImage,
  lineImageUrl,
  productIdsWithoutImage,
  useProductImageUrls,
} from '@/entities/product'
import {
  filterWishes,
  guardianWishStatusLabel,
  useAllWishRequestsQuery,
  wishesOfChild,
  WishSummaryCard,
  wishTitle,
  wishTotalAmount,
  type WishRequestLine,
} from '@/entities/wish'
import { getErrorMessage } from '@/shared/api'
import { memberPathsOf } from '@/shared/config'
import { cn, formatDateTime, formatWon, useArea } from '@/shared/lib'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StateMessage } from '@/shared/ui/StateMessage'

/**
 * 받은 조르기 (내 자녀 모두): 자녀로 거르기 → 답을 기다리는 조르기(크게) → 지난 조르기(목록).
 * 자녀 프로필에서 들어오면(/my/children/:childId/wishes) 그 자녀를 고른 채로 연다
 */
export function ShopWishesPage() {
  const paths = memberPathsOf(useArea())
  const navigate = useNavigate()
  const { childId: routeChildId } = useParams()
  const [search] = useSearchParams()
  const childId = search.get('child') ?? routeChildId ?? null
  const wishes = useAllWishRequestsQuery()
  const children = useChildrenQuery()
  const all = wishes.data ?? []
  const shown = wishesOfChild(all, childId)
  const waiting = filterWishes(shown, 'WAITING')
  const past = filterWishes(shown, 'DONE')
  const images = useProductImageUrls(productIdsWithoutImage(shown.flatMap((wish) => wish.items)))
  const nameOf = (id: string) => children.data?.find((child) => child.id === id)?.name ?? '자녀'
  const renderImage = (line: WishRequestLine) => (
    <ProductImage
      src={lineImageUrl(line, images)}
      alt={line.productName}
      className="size-full object-cover"
    />
  )
  const pick = (id: string | null) =>
    navigate(id ? `${paths.wishes}?child=${id}` : paths.wishes, { replace: true })

  return (
    <div className="shop-look space-y-6">
      <PageHeader
        title="받은 조르기"
        description="아이가 사 달라고 보낸 상품이에요. 7일 안에 답해 주세요."
      />
      {children.data && children.data.length > 1 && (
        <div role="group" aria-label="자녀로 거르기" className="flex flex-wrap gap-2">
          {[
            { id: null, label: '모든 자녀' },
            ...children.data.map((c) => ({ id: c.id, label: c.name })),
          ].map((option) => (
            <button
              key={option.id ?? 'all'}
              type="button"
              aria-pressed={childId === option.id}
              onClick={() => pick(option.id)}
              className={cn(
                'inline-flex min-h-10 items-center rounded-full border px-4 text-sm font-semibold',
                childId === option.id ? 'border-ink bg-ink text-white' : 'border-rule text-ink-2',
              )}
            >
              {option.label}
              {option.id && (
                <span className="figure ml-1">
                  {filterWishes(wishesOfChild(all, option.id), 'WAITING').length || ''}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
      {wishes.isPending && <StateMessage>불러오는 중…</StateMessage>}
      {wishes.isError && <StateMessage tone="error">{getErrorMessage(wishes.error)}</StateMessage>}
      {wishes.data && (
        <section aria-label="답을 기다리는 조르기" className="space-y-3">
          <h2 className="text-section">
            답을 기다려요 <span className="text-signal figure">{waiting.length}</span>
          </h2>
          {waiting.length === 0 && (
            <p className="bg-paper-2 text-ink-2 rounded-lg px-4 py-8 text-center text-sm">
              답을 기다리는 조르기가 없어요.
            </p>
          )}
          {waiting.map((wish) => (
            <Link
              key={wish.requestId}
              to={paths.childWish(wish.childId, wish.requestId)}
              aria-label={`${nameOf(wish.childId)}의 조르기 ${wishTitle(wish)} 답하러 가기`}
              className="block"
            >
              <WishSummaryCard
                wish={wish}
                statusLabel={guardianWishStatusLabel(wish)}
                renderImage={renderImage}
                leading={<strong className="text-ink text-sm">{nameOf(wish.childId)}</strong>}
                action={<span className="text-signal text-sm font-semibold">답하러 가기 ›</span>}
              />
            </Link>
          ))}
        </section>
      )}
      {past.length > 0 && (
        <section aria-label="지난 조르기" className="space-y-2">
          <h2 className="text-section">지난 조르기</h2>
          <ul className="divide-rule border-rule divide-y border-y">
            {past.map((wish) => (
              <li key={wish.requestId}>
                <Link
                  to={paths.childWish(wish.childId, wish.requestId)}
                  className="flex items-center gap-3 py-3"
                >
                  <span className="rounded-card block aspect-square w-12 shrink-0 overflow-hidden">
                    {wish.items[0] && renderImage(wish.items[0])}
                  </span>
                  <span className="min-w-0 flex-1 space-y-0.5">
                    <span className="block text-sm font-semibold">{wishTitle(wish)}</span>
                    <span className="text-ink-3 block text-xs">
                      {nameOf(wish.childId)} · {formatDateTime(wish.requestedAt)} ·{' '}
                      {guardianWishStatusLabel(wish)}
                    </span>
                  </span>
                  <span className="figure text-sm font-bold">
                    {formatWon(wishTotalAmount(wish))}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
