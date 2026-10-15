import { useState } from 'react'
import { Link } from 'react-router'
import { ChildPicker, useChildrenQuery } from '@/entities/child'
import {
  categoryNameOf,
  ProductCard,
  productMeta,
  useCategoriesQuery,
  useProductsQuery,
  type ProductSearch,
} from '@/entities/product'
import { FitBadge, useRecommendedProductsQuery } from '@/entities/recommendation'
import { hasRole, useSessionStore } from '@/entities/session'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { StateMessage } from '@/shared/ui/StateMessage'
import { MockBadge } from '@/shared/ui/MockBadge'

/** 쇼핑 첫 화면: 자녀를 고르면 맞는 사이즈가 판매 중인 상품만 보여 준다 */
export function ShopHomePage() {
  const user = useSessionStore((state) => state.user)
  const isBuyer = hasRole(user, 'BUYER')
  const children = useChildrenQuery({ enabled: isBuyer })
  const [childId, setChildId] = useState<string | null>(null)
  const [keyword, setKeyword] = useState('')
  const [search, setSearch] = useState<ProductSearch>({ keyword: '', categoryId: null })
  const all = useProductsQuery(search)
  const categories = useCategoriesQuery()
  const recommended = useRecommendedProductsQuery(childId)
  const query = childId === null ? all : recommended
  const child = children.data?.find((item) => item.id === childId)

  return (
    <div className="space-y-8">
      <section className="from-primary/15 to-growth/30 rounded-2xl bg-gradient-to-r px-5 py-7 md:px-8 md:py-10">
        <p className="text-primary text-sm font-semibold">브랜드마다 다른 사이즈, 이제 고민 끝</p>
        <h1 className="mt-2 text-2xl font-extrabold text-balance md:text-3xl">
          우리 아이에게 맞는 사이즈를 알려 드려요
        </h1>
        <p className="text-muted-foreground mt-2">
          자녀의 키 · 몸무게로 상품마다 추천 사이즈와 적합도를 보여 줘요.
        </p>
        {isBuyer && children.data?.length === 0 && (
          <Link
            to={paths.shop.children}
            className="bg-primary text-primary-foreground mt-4 inline-block rounded-lg px-4 py-2 text-sm font-semibold"
          >
            자녀 등록하고 맞춤 상품 보기
          </Link>
        )}
        {!user && (
          <Link
            to={paths.login}
            className="bg-primary text-primary-foreground mt-4 inline-block rounded-lg px-4 py-2 text-sm font-semibold"
          >
            로그인하기
          </Link>
        )}
      </section>

      {childId === null && (
        <section className="flex flex-wrap items-center gap-2">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              setSearch({ ...search, keyword })
            }}
          >
            <Input
              aria-label="상품 검색"
              placeholder="상품 이름으로 찾기"
              className="w-64 bg-white"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <Button type="submit" variant="outline">
              검색
            </Button>
          </form>
          <Button
            size="sm"
            variant={search.categoryId === null ? 'default' : 'outline'}
            onClick={() => setSearch({ ...search, categoryId: null })}
          >
            전체 카테고리
          </Button>
          {categories.data?.map((category) => (
            <Button
              key={category.id}
              size="sm"
              variant={search.categoryId === category.id ? 'default' : 'outline'}
              onClick={() => setSearch({ ...search, categoryId: category.id })}
            >
              {category.name}
            </Button>
          ))}
        </section>
      )}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">
            {child
              ? `${child.name}에게 맞는 상품`
              : search.keyword || search.categoryId
                ? '검색 결과'
                : '전체 상품'}
            <MockBadge
              endpoints={[
                childId === null ? 'GET /products' : 'GET /children/:childId/recommended-products',
              ]}
            />
          </h2>
          {isBuyer && (children.data?.length ?? 0) > 0 && (
            <ChildPicker
              children={children.data ?? []}
              selectedId={childId}
              onSelect={setChildId}
              noneLabel="전체"
              label={(item) => `${item.name} 맞춤 (${item.heightCm}cm)`}
            />
          )}
        </div>
        {query.isPending && childId !== null && <StateMessage>맞는 상품을 찾는 중…</StateMessage>}
        {query.isPending && childId === null && <StateMessage>불러오는 중…</StateMessage>}
        {query.isError && <StateMessage tone="error">{getErrorMessage(query.error)}</StateMessage>}
        {childId !== null && recommended.data?.content.length === 0 && (
          <StateMessage>맞는 사이즈가 판매 중인 상품이 없어요.</StateMessage>
        )}
        {childId === null && all.data?.content.length === 0 && (
          <StateMessage>
            {search.keyword || search.categoryId
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
                  meta={productMeta(product)}
                  price={product.minPrice}
                  imageUrl={product.imageUrl}
                />
              ))
            : recommended.data?.content.map((product) => (
                <ProductCard
                  key={product.id}
                  to={paths.shop.product(product.id, childId)}
                  name={product.name}
                  meta={productMeta({
                    categoryName: categoryNameOf(product.categoryId, categories.data ?? []),
                    brand: product.brand,
                  })}
                  price={product.minPrice}
                  imageUrl={product.imageUrl}
                  badge={<FitBadge size={product.recommendedSize} fit={product.fit} />}
                />
              ))}
        </div>
      </section>
    </div>
  )
}
