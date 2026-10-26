import { Link, useParams, useSearchParams } from 'react-router'
import { childProfileLine, SizeRulerBar, sizeRulerOf, useChildQuery } from '@/entities/child'
import { ProductTile, useCategoriesQuery } from '@/entities/product'
import { useRecommendedProductsInfiniteQuery } from '@/entities/recommendation'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { cn } from '@/shared/lib'
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
    <div className="shop-look space-y-6">
      <Link
        to={paths.shop.home}
        className="text-ink-3 hover:text-ink inline-flex items-center gap-1 rounded-md text-[13px] font-semibold transition-colors"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        홈
      </Link>
      <header className="border-rule grid gap-x-10 gap-y-4 rounded-lg border p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] md:items-end md:p-6">
        <div className="space-y-1">
          <h1 className="text-page">
            {child.data ? `${child.data.name}에게 맞는 옷` : '맞는 옷'}
            <MockBadge endpoints={['GET /children/:childId/recommended-products']} />
          </h1>
          {child.data && (
            <p className="text-ink text-sm font-semibold">{childProfileLine(child.data)}</p>
          )}
          {child.isError && (
            <StateMessage tone="error">{getErrorMessage(child.error)}</StateMessage>
          )}
          <p className="text-ink-3 text-[13px]">
            키에 맞는 사이즈가 판매 중인 상품만, 새로 나온 순서로 보여 드려요.
          </p>
        </div>
        {child.data && (
          <SizeRulerBar ruler={sizeRulerOf(child.data.heightCm)} name={child.data.name} />
        )}
      </header>

      <div
        role="tablist"
        aria-label="카테고리"
        className="border-rule flex gap-6 overflow-x-auto border-b"
      >
        {[{ id: null, name: '전체' }, ...(categories.data ?? [])].map((tab) => (
          <button
            key={tab.id ?? 'all'}
            type="button"
            role="tab"
            aria-selected={tab.id === categoryId}
            onClick={() => selectTab(tab.id)}
            className={cn(
              '-mb-px flex min-h-11 shrink-0 items-center border-b-2 text-[15px] font-bold transition-colors',
              tab.id === categoryId
                ? 'border-ink text-ink'
                : 'text-ink-3 hover:text-ink border-transparent',
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
        <p className="text-ink-3 text-sm">상품 {list.data.totalElements}개</p>
      )}
      <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 md:gap-x-4 lg:grid-cols-4">
        {list.data?.products.map((product) => (
          <ProductTile
            key={product.id}
            to={paths.shop.product(product.id, childId)}
            name={product.name}
            seller={product.businessName}
            price={product.minPrice}
            imageUrl={product.imageUrl}
            tag={
              product.recommendedSize
                ? { text: `${product.recommendedSize} 잘 맞아요`, fit: true }
                : { text: '사이즈 무관' }
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
