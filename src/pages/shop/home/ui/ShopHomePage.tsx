import { useRef } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useChildrenQuery } from '@/entities/child'
import {
  ProductTile,
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
import { ProductFilterBar } from './ProductFilterBar'
import { ProductSortSelect } from './ProductSortSelect'
import { RecommendedPreview } from './RecommendedPreview'

/**
 * 쇼핑 첫 화면 (셀러 마켓 모양): 카테고리 바로가기 · 자녀 맞춤 상품(자녀가 있을 때) · 전체 상품 · 키 기록.
 * 자녀 등록 안내는 머리말 띠 하나만 둔다.
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
  const all = useProductsQuery(search, page)
  const categories = useCategoriesQuery()
  const kids = children.data ?? []
  const child = kids.find((item) => item.id === params.get('child')) ?? kids[0] ?? null
  const listRef = useRef<HTMLElement>(null)
  // 맞춤 영역: 자녀가 있는 보호자에게만. 검색 중에는 숨긴다
  const showsRecommended = isBuyer && child !== null && !keyword
  const isFiltered = Boolean(keyword || filters.categoryId || filters.attributes?.length)

  const changePage = (next: number) => {
    writeParams((latest) => writeProductPage(latest, next))
    listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="shop-look flex flex-col gap-8 md:gap-10">
      <CategoryCircles
        categories={categories.data ?? []}
        selectedId={filters.categoryId}
        onSelect={(categoryId) => update({ categoryId, attributes: [] })}
      />

      {showsRecommended && (
        <RecommendedPreview kids={kids} child={child} onSelectChild={setChildId} />
      )}

      <section
        ref={listRef}
        aria-label="전체 상품"
        className="scroll-mt-6 space-y-4 md:scroll-mt-44"
      >
        {/* 목록 머리: 제목 · 개수 · 검색어 왼쪽, 정렬 오른쪽. 카테고리를 고르면 아래에 옵션 거르기 */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
            <h2 className="text-section">
              {keyword ? `"${keyword}" 검색 결과` : isFiltered ? '검색 결과' : '전체 상품'}
              <MockBadge endpoints={['GET /products']} />
            </h2>
            {all.data && (
              <span className="text-ink-3 figure text-sm">{all.data.totalElements}</span>
            )}
            {keyword && (
              <Link
                to={paths.shop.home}
                className="text-ink-3 hover:text-ink ml-1 text-[13px] underline underline-offset-4"
              >
                검색 지우기
              </Link>
            )}
          </div>
          <ProductSortSelect sort={filters.sort} onChange={(sort) => update({ sort })} />
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
        <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 md:gap-x-4 lg:grid-cols-4">
          {all.data?.content.map((product) => (
            <ProductTile
              key={product.id}
              to={paths.shop.product(product.id)}
              name={product.name}
              seller={product.businessName}
              price={product.minPrice}
              imageUrl={product.imageUrl}
              isSoldOut={product.soldOut}
              tag={product.sizeFree ? { text: '사이즈 무관' } : undefined}
            />
          ))}
        </div>
        {all.data && (
          <Pagination page={all.data.page} totalPages={all.data.totalPages} onChange={changePage} />
        )}
      </section>

      {child && (
        <section className="bg-paper-2 rounded-card grid gap-5 p-5 md:p-7 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:items-center">
          <div className="space-y-1.5">
            <h2 className="text-section">작아진 옷, 키만 알려주세요</h2>
            <p className="text-ink-2 max-w-[44ch] text-sm">
              {child.name}의 키를 새로 기록하면 자녀 프로필에 쌓이고, 추천 사이즈와 상품 목록이 바로
              바뀌어요.
            </p>
          </div>
          <QuickHeightForm child={child} />
        </section>
      )}
    </div>
  )
}
