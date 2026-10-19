import { useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useChildrenQuery } from '@/entities/child'
import {
  ProductCard,
  listItemMeta,
  readProductFilters,
  readProductPage,
  writeProductFilters,
  writeProductPage,
  type ProductFilters,
  useCategoriesQuery,
  useProductsQuery,
  type ProductSearch,
} from '@/entities/product'
import { hasRole, useSessionStore } from '@/entities/session'
import { QuickHeightForm } from '@/features/edit-child'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { MockBadge } from '@/shared/ui/MockBadge'
import { Pagination } from '@/shared/ui/Pagination'
import { CardGridSkeleton } from '@/shared/ui/Skeleton'
import { StateMessage } from '@/shared/ui/StateMessage'
import { CategoryCircles } from './CategoryCircles'
import { FitPassportCard } from './FitPassportCard'
import { ProductFilterBar } from './ProductFilterBar'
import { RecommendedPreview } from './RecommendedPreview'
import { SizeHero } from './SizeHero'

/**
 * 쇼핑 첫 화면 (디자인 E안): 자녀 추천 사이즈 · Fit Passport · 자녀 맞춤 상품(맛보기) · 카테고리 · 전체 상품.
 * 검색어는 머리말 검색창이 주소(?q=)에 싣는다. 검색 중에는 전체 상품 검색 결과만 보인다
 */
export function ShopHomePage() {
  const user = useSessionStore((state) => state.user)
  const isBuyer = hasRole(user, 'BUYER')
  const children = useChildrenQuery({ enabled: isBuyer })
  // 검색어(q) · 거르기(cat · sort · attr) · 페이지(page) · 맞춤 자녀(child)는 주소에 둔다 → 상세에서 뒤로 와도 그대로
  const [params, setParams] = useSearchParams()
  const keyword = params.get('q') ?? ''
  const filters = readProductFilters(params)
  const search: ProductSearch = { ...filters, keyword }
  const page = readProductPage(params)
  /**
   * 바뀐 값만 받아 최신 주소에 얹는다. 주소 변경은 화면에 조금 늦게 반영되므로,
   * 화면에 그려진 값으로 다시 쓰면 바로 앞 변경(예: 카테고리 해제)을 덮어쓴다.
   * setParams의 함수형 인자(prev)도 화면에 그려진 시점의 값이라, 주소창의 값을 직접 읽는다
   */
  const writeParams = (change: (latest: URLSearchParams) => URLSearchParams) =>
    setParams(change(new URLSearchParams(window.location.search)), { replace: true })
  const update = (patch: Partial<ProductFilters>) =>
    writeParams((latest) =>
      writeProductFilters(latest, { ...readProductFilters(latest), ...patch }),
    )
  const setChildId = (childId: string) =>
    writeParams((latest) => {
      latest.set('child', childId)
      return latest
    })
  const [heroIndex, setHeroIndex] = useState(0)
  const all = useProductsQuery(search, page)
  const categories = useCategoriesQuery()
  const kids = children.data ?? []
  const child = kids.find((item) => item.id === params.get('child')) ?? kids[0] ?? null
  const heroChild = kids.length > 0 ? kids[heroIndex % kids.length] : null
  const recommendedRef = useRef<HTMLElement>(null)
  const listRef = useRef<HTMLElement>(null)
  // 맞춤 영역: 보호자에게만 (자녀가 없으면 등록 안내). 검색 중에는 숨긴다
  const showsRecommended = isBuyer && children.isSuccess && !keyword

  const shopHeroSize = () => {
    if (!heroChild) return
    setChildId(heroChild.id)
    recommendedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const changePage = (next: number) => {
    writeParams((latest) => writeProductPage(latest, next))
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

      {showsRecommended && (
        <RecommendedPreview
          ref={recommendedRef}
          kids={kids}
          child={child}
          onSelectChild={setChildId}
        />
      )}

      <CategoryCircles
        categories={categories.data ?? []}
        selectedId={filters.categoryId}
        onSelect={(categoryId) => update({ categoryId, attributes: [] })}
      />

      <section
        ref={listRef}
        aria-label="전체 상품"
        className="scroll-mt-40 space-y-4 md:scroll-mt-28"
      >
        <div>
          <p className="text-primary text-xs font-bold tracking-widest">
            {keyword ? 'SEARCH' : 'ALL PRODUCTS'}
          </p>
          <h2 className="text-2xl font-extrabold">
            {keyword || filters.categoryId || filters.attributes?.length
              ? '검색 결과'
              : '전체 상품'}
            <MockBadge endpoints={['GET /products']} />
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
        <ProductFilterBar search={search} onChange={(patch) => update(patch)} />
        {all.isPending && <CardGridSkeleton />}
        {all.isError && <StateMessage tone="error">{getErrorMessage(all.error)}</StateMessage>}
        {all.data?.content.length === 0 && (
          <StateMessage>
            {keyword || filters.categoryId
              ? '조건에 맞는 상품이 없어요.'
              : '아직 판매 중인 상품이 없어요.'}
          </StateMessage>
        )}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {all.data?.content.map((product) => (
            <ProductCard
              key={product.id}
              to={paths.shop.product(product.id)}
              name={product.name}
              meta={listItemMeta(product)}
              price={product.minPrice}
              imageUrl={product.imageUrl}
            />
          ))}
        </div>
        {all.data && (
          <Pagination page={all.data.page} totalPages={all.data.totalPages} onChange={changePage} />
        )}
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
