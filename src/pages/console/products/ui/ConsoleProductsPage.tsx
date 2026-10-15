import { useState } from 'react'
import { Link } from 'react-router'
import { ChildPicker, useChildrenQuery } from '@/entities/child'
import {
  categoryNameOf,
  ProductCard,
  productMeta,
  useCategoriesQuery,
  useProductsQuery,
} from '@/entities/product'
import { FitBadge, useRecommendedProductsQuery } from '@/entities/recommendation'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StateMessage } from '@/shared/ui/StateMessage'

/** 전체 상품 또는 자녀 맞춤 목록 (맞는 사이즈가 판매 중인 상품만) */
export function ConsoleProductsPage() {
  const children = useChildrenQuery()
  const [childId, setChildId] = useState<string | null>(null)
  const all = useProductsQuery()
  const categories = useCategoriesQuery().data ?? []
  const recommended = useRecommendedProductsQuery(childId)
  const query = childId === null ? all : recommended

  return (
    <div className="space-y-4">
      <PageHeader
        mockEndpoints={[
          childId === null ? 'GET /products' : 'GET /children/:childId/recommended-products',
        ]}
        title="상품"
        step="③"
        note="자녀를 고르면 추천이 자기 복사본(자녀 · 상품)으로 맞는 사이즈가 있는 상품만 보여 줘요."
      />
      <ChildPicker
        children={children.data ?? []}
        selectedId={childId}
        onSelect={setChildId}
        noneLabel="전체"
        label={(child) => `${child.name} 맞춤 (${child.heightCm}cm)`}
      />
      {children.data?.length === 0 && (
        <Link to={paths.console.children} className="text-primary text-sm underline">
          자녀를 등록하면 맞는 옷만 골라 드려요
        </Link>
      )}

      {query.isPending && <StateMessage>불러오는 중…</StateMessage>}
      {query.isError && <StateMessage tone="error">{getErrorMessage(query.error)}</StateMessage>}
      {childId !== null && recommended.data?.content.length === 0 && (
        <StateMessage>맞는 사이즈가 있는 상품이 없어요.</StateMessage>
      )}
      <div className="grid grid-cols-2 gap-3">
        {childId === null
          ? all.data?.content.map((product) => (
              <ProductCard
                key={product.id}
                to={paths.console.product(product.id)}
                name={product.name}
                meta={productMeta(product)}
                price={product.minPrice}
                imageUrl={product.imageUrl}
              />
            ))
          : recommended.data?.content.map((product) => (
              <ProductCard
                key={product.id}
                to={paths.console.product(product.id, childId)}
                name={product.name}
                meta={productMeta({
                  categoryName: categoryNameOf(product.categoryId, categories),
                  brand: product.brand,
                })}
                price={product.minPrice}
                imageUrl={product.imageUrl}
                badge={<FitBadge size={product.recommendedSize} fit={product.fit} />}
              />
            ))}
      </div>
    </div>
  )
}
