import { Link, useParams, useSearchParams } from 'react-router'
import { childProfileLine, useChildQuery } from '@/entities/child'
import { ProductCard, useCategoriesQuery } from '@/entities/product'
import { useRecommendedProductsInfiniteQuery } from '@/entities/recommendation'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { cn } from '@/shared/lib'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { MockBadge } from '@/shared/ui/MockBadge'
import { CardGridSkeleton } from '@/shared/ui/Skeleton'
import { StateMessage } from '@/shared/ui/StateMessage'

/**
 * 자녀 맞춤 목록 (홈 「더보기」): 키에 맞는 사이즈가 판매 중인 상품, 신상품순 고정.
 * 탭은 「전체」 + 말단 카테고리 (중간 카테고리는 서버가 빈 목록을 준다). 「더 보기」로 다음 페이지를 이어 붙인다
 */
export function ShopRecommendedPage() {
  const { childId = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const categoryId = params.get('cat')
  const child = useChildQuery(childId)
  // 카테고리 목록은 말단만 담는다 (toCategories가 트리의 끝만 고른다) → 탭이 빈 목록이 되지 않는다
  const categories = useCategoriesQuery()
  const list = useRecommendedProductsInfiniteQuery(childId, categoryId)

  const selectTab = (next: string | null) => setParams(next ? { cat: next } : {}, { replace: true })

  return (
    <div className="space-y-6">
      <Link to={paths.shop.home} className="text-muted-foreground text-sm hover:underline">
        ← 홈
      </Link>
      <header className="bg-growth-soft space-y-1 rounded-3xl p-6">
        <h1 className="text-2xl font-extrabold">
          {child.data ? `${child.data.name}에게 맞는 옷` : '맞는 옷'}
          <MockBadge endpoints={['GET /children/:childId/recommended-products']} />
        </h1>
        {child.data && (
          <p className="text-growth-deep text-sm font-semibold">{childProfileLine(child.data)}</p>
        )}
        {child.isError && <StateMessage tone="error">{getErrorMessage(child.error)}</StateMessage>}
        <p className="text-muted-foreground text-xs">
          키에 맞는 사이즈가 판매 중인 상품만, 새로 나온 순서로 보여 드려요.
        </p>
      </header>

      <div role="tablist" aria-label="카테고리" className="flex gap-2 overflow-x-auto pb-1">
        {[{ id: null, name: '전체' }, ...(categories.data ?? [])].map((tab) => (
          <button
            key={tab.id ?? 'all'}
            type="button"
            role="tab"
            aria-selected={tab.id === categoryId}
            onClick={() => selectTab(tab.id)}
            className={cn(
              'shrink-0 rounded-full border px-4 py-1.5 text-sm',
              tab.id === categoryId && 'border-primary bg-primary text-primary-foreground',
            )}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {list.isPending && <CardGridSkeleton />}
      {list.isError && <StateMessage tone="error">{getErrorMessage(list.error)}</StateMessage>}
      {list.data?.products.length === 0 && (
        <StateMessage>맞는 사이즈가 판매 중인 상품이 없어요.</StateMessage>
      )}
      {list.data && list.data.products.length > 0 && (
        <p className="text-muted-foreground text-sm">상품 {list.data.totalElements}개</p>
      )}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {list.data?.products.map((product) => (
          <ProductCard
            key={product.id}
            to={paths.shop.product(product.id, childId)}
            name={product.name}
            meta={product.businessName ?? ''}
            price={product.minPrice}
            imageUrl={product.imageUrl}
            badge={
              <Badge variant="growth">
                {product.recommendedSize ? `${product.recommendedSize} 잘 맞아요` : '사이즈 무관'}
              </Badge>
            }
          />
        ))}
      </div>
      {list.hasNextPage && (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            disabled={list.isFetchingNextPage}
            onClick={() => list.fetchNextPage()}
          >
            {list.isFetchingNextPage ? '불러오는 중…' : '더 보기'}
          </Button>
        </div>
      )}
    </div>
  )
}
