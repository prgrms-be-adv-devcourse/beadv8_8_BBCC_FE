import { useState } from 'react'
import { Link } from 'react-router'
import { ChildPicker, useChildrenQuery } from '@/entities/child'
import { ProductCard, useProductsQuery } from '@/entities/product'
import { FitBadge, useRecommendedProductsQuery } from '@/entities/recommendation'
import { getErrorMessage } from '@/shared/api'
import { PageHeader, StateMessage } from '@/shared/ui/page-header'

/** 전체 상품 또는 자녀 맞춤 목록 (맞는 사이즈가 판매 중인 상품만) */
export function ProductsPage() {
  const children = useChildrenQuery()
  const [childId, setChildId] = useState<string | null>(null)
  const all = useProductsQuery()
  const recommended = useRecommendedProductsQuery(childId)
  const query = childId === null ? all : recommended

  return (
    <div className="space-y-4">
      <PageHeader
        title="③ 상품"
        description="자녀를 고르면 추천이 자기 복사본(자녀 · 상품)으로 맞는 사이즈가 있는 상품만 보여 줘요."
      />
      <ChildPicker
        children={children.data ?? []}
        selectedId={childId}
        onSelect={setChildId}
        noneLabel="전체"
        label={(child) => `${child.name} 맞춤 (${child.heightCm}cm)`}
      />
      {children.data?.length === 0 && (
        <Link to="/children" className="text-primary text-sm underline">
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
                to={`/products/${product.id}`}
                name={product.name}
                meta={`${product.categoryName} · ${product.sellerName}`}
                price={product.minPrice}
              />
            ))
          : recommended.data?.content.map((product) => (
              <ProductCard
                key={product.id}
                to={`/products/${product.id}?childId=${childId}`}
                name={product.name}
                meta={`${product.categoryName} · ${product.sellerName}`}
                price={product.minPrice}
                badge={<FitBadge size={product.recommendedSize} fit={product.fit} />}
              />
            ))}
      </div>
    </div>
  )
}
