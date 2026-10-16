import { useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ChildPicker, sizeBandOf, useChildrenQuery } from '@/entities/child'
import {
  ProductCard,
  listItemMeta,
  readProductFilters,
  writeProductFilters,
  type ProductFilters,
  useCategoriesQuery,
  useProductsQuery,
  type ProductSearch,
} from '@/entities/product'
import { useRecommendedProductsQuery } from '@/entities/recommendation'
import { hasRole, useSessionStore } from '@/entities/session'
import { QuickHeightForm } from '@/features/edit-child'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { Badge } from '@/shared/ui/badge'
import { MockBadge } from '@/shared/ui/MockBadge'
import { CardGridSkeleton } from '@/shared/ui/Skeleton'
import { StateMessage } from '@/shared/ui/StateMessage'
import { CategoryCircles } from './CategoryCircles'
import { FitPassportCard } from './FitPassportCard'
import { ProductFilterBar } from './ProductFilterBar'
import { SizeHero } from './SizeHero'

/**
 * 쇼핑 첫 화면 (디자인 E안): 자녀 추천 사이즈 · Fit Passport · 카테고리 · 사이즈 재고 상품.
 * 검색어는 머리말 검색창이 주소(?q=)에 싣는다. 자녀를 고르면 맞는 사이즈가 판매 중인 상품만 보여 준다
 */
export function ShopHomePage() {
  const user = useSessionStore((state) => state.user)
  const isBuyer = hasRole(user, 'BUYER')
  const children = useChildrenQuery({ enabled: isBuyer })
  // 검색어(q) · 거르기(cat · sort · attr) · 자녀 맞춤(child)은 주소에 둔다 → 상세에서 뒤로 와도 그대로
  const [params, setParams] = useSearchParams()
  const keyword = params.get('q') ?? ''
  const filters = readProductFilters(params)
  const search: ProductSearch = { ...filters, keyword }
  const pickedChildId = params.get('child')
  /**
   * 바뀐 값만 받아 최신 주소(prev)에 얹는다. 주소 변경은 조금 늦게 반영되므로,
   * 화면에 그려진 값(filters)으로 전체를 다시 쓰면 바로 앞 변경(예: 카테고리 해제)을 덮어쓴다
   */
  const update = (patch: Partial<ProductFilters>, child?: string | null) =>
    setParams(
      (prev) => {
        const next = writeProductFilters(prev, { ...readProductFilters(prev), ...patch })
        if (child !== undefined) {
          if (child) next.set('child', child)
          else next.delete('child')
        }
        return next
      },
      { replace: true },
    )
  const setChildId = (child: string | null) => update({}, child)
  // 검색 중에는 전체 상품에서 찾는다
  const childId = keyword ? null : pickedChildId
  const [heroIndex, setHeroIndex] = useState(0)
  const all = useProductsQuery(search)
  const categories = useCategoriesQuery()
  const recommended = useRecommendedProductsQuery(childId)
  const query = childId === null ? all : recommended
  const kids = children.data ?? []
  const child = kids.find((item) => item.id === childId)
  const heroChild = kids.length > 0 ? kids[heroIndex % kids.length] : null
  const listRef = useRef<HTMLElement>(null)

  const shopHeroSize = () => {
    if (!heroChild) return
    setChildId(heroChild.id)
    listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="space-y-12">
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <SizeHero
          child={heroChild}
          loggedIn={!!user}
          onShopSize={shopHeroSize}
          onNextChild={kids.length > 1 ? () => setHeroIndex((index) => index + 1) : null}
        />
        <FitPassportCard child={heroChild} />
      </div>

      <CategoryCircles
        categories={categories.data ?? []}
        selectedId={filters.categoryId}
        onSelect={(categoryId) => update({ categoryId, attributes: [] }, null)}
      />

      <section ref={listRef} className="scroll-mt-28 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-primary text-xs font-bold tracking-widest">
              {child
                ? `SIZE ${sizeBandOf(child.heightCm).size} IN STOCK`
                : keyword
                  ? 'SEARCH'
                  : 'ALL PRODUCTS'}
            </p>
            <h2 className="text-2xl font-extrabold">
              {child
                ? `${child.name}에게 맞는 상품`
                : keyword || filters.categoryId || filters.attributes?.length
                  ? '검색 결과'
                  : '전체 상품'}
              <MockBadge
                endpoints={[
                  childId === null
                    ? 'GET /products'
                    : 'GET /children/:childId/recommended-products',
                ]}
              />
            </h2>
            {keyword && (
              <p className="text-muted-foreground mt-1 text-sm">
                "{keyword}" 검색 결과 ·{' '}
                <Link to={paths.shop.home} className="underline">
                  검색 지우기
                </Link>
              </p>
            )}
          </div>
          {isBuyer && kids.length > 0 && !keyword && (
            <ChildPicker
              children={kids}
              selectedId={childId}
              onSelect={setChildId}
              noneLabel="전체"
              label={(item) => `${item.name} 맞춤 (${item.heightCm}cm)`}
            />
          )}
        </div>
        {childId === null && (
          <ProductFilterBar search={search} onChange={(patch) => update(patch)} />
        )}
        {query.isPending && <CardGridSkeleton />}
        {query.isError && <StateMessage tone="error">{getErrorMessage(query.error)}</StateMessage>}
        {childId !== null && recommended.data?.content.length === 0 && (
          <StateMessage>맞는 사이즈가 판매 중인 상품이 없어요.</StateMessage>
        )}
        {childId === null && all.data?.content.length === 0 && (
          <StateMessage>
            {keyword || filters.categoryId
              ? '조건에 맞는 상품이 없어요.'
              : '아직 판매 중인 상품이 없어요.'}
          </StateMessage>
        )}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {childId === null
            ? all.data?.content.map((product) => (
                <ProductCard
                  key={product.id}
                  to={paths.shop.product(product.id)}
                  name={product.name}
                  meta={listItemMeta(product)}
                  price={product.minPrice}
                  imageUrl={product.imageUrl}
                />
              ))
            : recommended.data?.content.map((product) => (
                <ProductCard
                  key={product.id}
                  to={paths.shop.product(product.id, childId)}
                  name={product.name}
                  meta={product.businessName ?? ''}
                  price={product.minPrice}
                  imageUrl={product.imageUrl}
                  badge={
                    <Badge variant="growth">
                      {product.recommendedSize
                        ? `${product.recommendedSize} 잘 맞아요`
                        : '사이즈 무관'}
                    </Badge>
                  }
                />
              ))}
        </div>
      </section>

      {heroChild && (
        <section className="bg-growth-soft flex flex-col gap-4 rounded-3xl p-6 md:flex-row md:items-center md:p-8">
          <div className="flex-1">
            <h2 className="text-growth-deep text-xl font-extrabold">작아진 옷, 키만 알려주세요</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {heroChild.name}의 키를 새로 기록하면 Fit Passport에 쌓이고, 추천 사이즈와 상품 목록이
              바로 바뀌어요.
            </p>
          </div>
          <QuickHeightForm child={heroChild} className="md:w-96" />
        </section>
      )}

      <section className="bg-primary-deep text-primary-foreground flex flex-col gap-4 rounded-3xl p-6 md:flex-row md:items-center md:p-8">
        <div className="flex-1">
          <h2 className="text-xl font-extrabold">키즈 브랜드 입점 모집</h2>
          <p className="mt-1 text-sm opacity-80">
            상품 등록부터 정산까지 Kidly 판매자 센터에서 관리하세요.
          </p>
        </div>
        <Link
          to={paths.center.apply}
          className="bg-highlight text-highlight-foreground self-start rounded-full px-6 py-2.5 text-sm font-bold md:self-auto"
        >
          입점 신청
        </Link>
      </section>
    </div>
  )
}
