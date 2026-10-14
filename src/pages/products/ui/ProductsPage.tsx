import type { ReactNode } from 'react'
import { useState } from 'react'
import { Link } from 'react-router'
import { useChildrenQuery } from '@/entities/child'
import { useProductsQuery } from '@/entities/product'
import { FIT_LABEL, useRecommendedProductsQuery } from '@/entities/recommendation'
import { getErrorMessage } from '@/shared/api'
import { formatWon } from '@/shared/lib'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { PageHeader, StateMessage } from '@/shared/ui/page-header'

/** 전체 상품 또는 자녀 맞춤 목록 (맞는 사이즈가 판매 중인 상품만) */
export function ProductsPage() {
  const children = useChildrenQuery()
  const [childId, setChildId] = useState<number | null>(null)
  const all = useProductsQuery()
  const recommended = useRecommendedProductsQuery(childId)

  return (
    <div className="space-y-4">
      <PageHeader
        title="③ 상품"
        description="자녀를 고르면 추천이 자기 복사본(자녀 · 상품)으로 맞는 사이즈가 있는 상품만 보여 줘요."
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={childId === null ? 'default' : 'outline'}
          onClick={() => setChildId(null)}
        >
          전체
        </Button>
        {children.data?.map((child) => (
          <Button
            key={child.id}
            size="sm"
            variant={childId === child.id ? 'default' : 'outline'}
            onClick={() => setChildId(child.id)}
          >
            {child.name} 맞춤 ({child.heightCm}cm)
          </Button>
        ))}
        {children.data?.length === 0 && (
          <Link to="/children" className="text-primary text-sm underline">
            자녀를 등록하면 맞는 옷만 골라 드려요
          </Link>
        )}
      </div>

      {childId === null ? (
        <>
          {all.isPending && <StateMessage>불러오는 중…</StateMessage>}
          {all.isError && <StateMessage tone="error">{getErrorMessage(all.error)}</StateMessage>}
          <div className="grid grid-cols-2 gap-3">
            {all.data?.content.map((product) => (
              <ProductCard
                key={product.productId}
                productId={product.productId}
                name={product.name}
                meta={`${product.categoryName} · ${product.sellerName}`}
                price={product.minPrice}
              />
            ))}
          </div>
        </>
      ) : (
        <>
          {recommended.isPending && <StateMessage>불러오는 중…</StateMessage>}
          {recommended.isError && (
            <StateMessage tone="error">{getErrorMessage(recommended.error)}</StateMessage>
          )}
          {recommended.data?.content.length === 0 && (
            <StateMessage>맞는 사이즈가 있는 상품이 없어요.</StateMessage>
          )}
          <div className="grid grid-cols-2 gap-3">
            {recommended.data?.content.map((product) => (
              <ProductCard
                key={product.productId}
                productId={product.productId}
                name={product.name}
                meta={`${product.categoryName} · ${product.sellerName}`}
                price={product.minPrice}
                badge={
                  <Badge variant="growth">
                    추천 {product.recommendedSize} · {FIT_LABEL[product.fit]}
                  </Badge>
                }
                childId={childId}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function ProductCard(props: {
  productId: string
  name: string
  meta: string
  price: number
  badge?: ReactNode
  childId?: number
}) {
  const to = props.childId
    ? `/products/${props.productId}?childId=${props.childId}`
    : `/products/${props.productId}`
  return (
    <Link to={to}>
      <Card className="hover:border-primary space-y-2 transition-colors">
        <div className="bg-muted text-muted-foreground flex aspect-[4/3] items-center justify-center rounded-lg text-xs">
          상품 이미지
        </div>
        <p className="font-medium">{props.name}</p>
        <p className="text-muted-foreground text-xs">{props.meta}</p>
        <div className="flex items-center justify-between">
          <span className="font-semibold">{formatWon(props.price)}</span>
          {props.badge}
        </div>
      </Card>
    </Link>
  )
}
