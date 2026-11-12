import { Link } from 'react-router'
import {
  FAVORITE_DISPLAY_STATUS_LABEL,
  useMyFavoritesQuery,
  type FavoriteDisplayStatus,
} from '@/entities/favorite'
import { ProductImage } from '@/entities/product'
import { FavoriteButton } from '@/features/toggle-favorite'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { formatDateTime } from '@/shared/lib'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { PageHeader } from '@/shared/ui/PageHeader'
import { ListSkeleton } from '@/shared/ui/Skeleton'
import { StateMessage } from '@/shared/ui/StateMessage'

const BADGE_VARIANT = {
  ON_SALE: 'success',
  SOLD_OUT: 'highlight',
  SALE_ENDED: 'muted',
} as const satisfies Record<FavoriteDisplayStatus, string>

/** 내 찜: 최신순, 상품마다 판매 상태(판매 중 · 품절 · 판매 종료)와 찜 취소 */
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
        <div className="border-rule space-y-2 rounded-lg border p-5 text-center">
          <p className="font-semibold">아직 찜한 상품이 없어요</p>
          <p className="text-ink-3 text-[13px]">상품 상세에서 하트를 누르면 여기에 모여요.</p>
          <Link to={paths.shop.home} className="shop-link text-sm">
            상품 보러 가기
          </Link>
        </div>
      ) : (
        <>
          <ul
            aria-label="찜한 상품"
            className="border-rule divide-rule divide-y rounded-lg border px-4"
          >
            {favorites.data.map((item) => {
              const name = item.productName ?? `상품 #${item.productId}`
              return (
                <li key={item.productId} className="flex items-center gap-3 py-3">
                  <Link to={paths.shop.product(item.productId)} className="flex-none">
                    <ProductImage
                      src={item.thumbnailUrl}
                      alt={name}
                      className="rounded-card size-16"
                    />
                  </Link>
                  <div className="min-w-0 flex-1 space-y-1">
                    <Link
                      to={paths.shop.product(item.productId)}
                      className="hover:text-primary block truncate text-sm font-semibold"
                    >
                      {name}
                    </Link>
                    <p className="text-ink-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
                      {item.displayStatus && (
                        <Badge variant={BADGE_VARIANT[item.displayStatus]}>
                          {FAVORITE_DISPLAY_STATUS_LABEL[item.displayStatus]}
                        </Badge>
                      )}
                      <span className="figure">{formatDateTime(item.favoritedAt)} 찜</span>
                    </p>
                  </div>
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
