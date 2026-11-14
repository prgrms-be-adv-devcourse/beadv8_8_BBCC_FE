import { Link } from 'react-router'
import {
  canQuickAddFavorite,
  FAVORITE_DISPLAY_STATUS_LABEL,
  favoriteStampOf,
  useMyFavoritesQuery,
  type FavoriteDisplayStatus,
} from '@/entities/favorite'
import { ALL_CATEGORIES_ICON, ProductImage } from '@/entities/product'
import { FavoriteButton } from '@/features/toggle-favorite'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { cn, formatDateTime } from '@/shared/lib'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { PageHeader } from '@/shared/ui/PageHeader'
import { ListSkeleton } from '@/shared/ui/Skeleton'
import { StateMessage } from '@/shared/ui/StateMessage'
import { QuickAdd } from '@/widgets/quick-add'

const BADGE_VARIANT = {
  ON_SALE: 'success',
  SOLD_OUT: 'highlight',
  SALE_ENDED: 'muted',
} as const satisfies Record<FavoriteDisplayStatus, string>

/** 내 찜: 최신순, 상품마다 판매 상태(판매 중 · 품절 · 판매 종료)와 찜 취소. 판매 중이면 담기 팝업을 열 수 있고, 아니면 사진에 도장을 찍는다 */
export function ShopMyFavoritesPage() {
  const favorites = useMyFavoritesQuery()

  return (
    <div className="shop-look space-y-6">
      <PageHeader title="내 찜" />
      {favorites.isPending ? (
        <ListSkeleton rows={3} />
      ) : favorites.isError ? (
        <StateMessage tone="error">{getErrorMessage(favorites.error)}</StateMessage>
      ) : favorites.data.length === 0 ? (
        <div className="bg-paper-2 space-y-2 p-8 text-center">
          <p className="font-semibold">아직 찜한 상품이 없어요</p>
          <p className="text-ink-2 text-[13px]">상품 상세에서 하트를 누르면 여기에 모여요.</p>
          <Link to={paths.shop.home} className="shop-link text-sm">
            상품 보러 가기
          </Link>
        </div>
      ) : (
        <>
          <ul
            aria-label="찜한 상품"
            className="border-ink divide-rule divide-y border-[1.5px] px-4"
          >
            {favorites.data.map((item) => {
              const name = item.productName ?? `상품 #${item.productId}`
              const stamp = favoriteStampOf(item.displayStatus)
              return (
                <li key={item.productId} className="flex items-center gap-3 py-3">
                  <Link to={paths.shop.product(item.productId)} className="relative flex-none">
                    <ProductImage
                      src={item.thumbnailUrl}
                      alt={name}
                      doodle={ALL_CATEGORIES_ICON}
                      className={cn(
                        'border-ink aspect-[4/5] w-[72px] border',
                        stamp && 'opacity-45',
                      )}
                    />
                    {stamp && (
                      <span
                        aria-hidden
                        className="border-ink bg-paper/85 font-display absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[14deg] border-2 px-1.5 text-xs whitespace-nowrap"
                      >
                        {stamp}
                      </span>
                    )}
                  </Link>
                  <div className="min-w-0 flex-1 space-y-1">
                    <Link
                      to={paths.shop.product(item.productId)}
                      className="block truncate text-[15px] font-bold underline-offset-[3px] hover:underline"
                    >
                      {name}
                    </Link>
                    <p className="text-ink-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
                      {item.displayStatus && (
                        <Badge variant={BADGE_VARIANT[item.displayStatus]}>
                          {FAVORITE_DISPLAY_STATUS_LABEL[item.displayStatus]}
                        </Badge>
                      )}
                      <span className="figure">{formatDateTime(item.favoritedAt)} 찜</span>
                    </p>
                  </div>
                  {canQuickAddFavorite(item.displayStatus) && (
                    <QuickAdd productId={item.productId} productName={name} />
                  )}
                  <FavoriteButton productId={item.productId} isFavorited isSelling={false} />
                </li>
              )
            })}
          </ul>
          {favorites.hasNextPage && (
            <Button
              variant="outline"
              size="lg"
              disabled={favorites.isFetchingNextPage}
              onClick={() => void favorites.fetchNextPage()}
            >
              더 보기
            </Button>
          )}
        </>
      )}
    </div>
  )
}
