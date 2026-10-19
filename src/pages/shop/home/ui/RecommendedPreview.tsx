import type { Ref } from 'react'
import { Link } from 'react-router'
import { ChildPicker, sizeBandOf, type Child } from '@/entities/child'
import { ProductCard } from '@/entities/product'
import { useRecommendedProductsQuery } from '@/entities/recommendation'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { Badge } from '@/shared/ui/badge'
import { MockBadge } from '@/shared/ui/MockBadge'
import { CardGridSkeleton } from '@/shared/ui/Skeleton'
import { StateMessage } from '@/shared/ui/StateMessage'

/** 홈 맞춤 영역은 맛보기로 4개만 보이고, 나머지는 「더보기」(맞춤 목록 화면)에서 본다 */
const PREVIEW_SIZE = 4

type RecommendedPreviewProps = {
  kids: Child[]
  child: Child | null
  onSelectChild: (childId: string) => void
  /** 히어로 「맞는 옷 보기」가 이 영역으로 내려온다 */
  ref?: Ref<HTMLElement>
}

/** 홈 위 「{자녀}에게 맞는 옷」: 자녀 칩 · 맞춤 상품 4개 · 더보기. 자녀가 없으면 등록 안내 */
export function RecommendedPreview({ kids, child, onSelectChild, ref }: RecommendedPreviewProps) {
  const recommended = useRecommendedProductsQuery(child?.id ?? null, { size: PREVIEW_SIZE })

  if (!child)
    return (
      <section ref={ref} className="bg-growth-soft space-y-2 rounded-3xl p-6">
        <h2 className="text-xl font-extrabold">우리 아이에게 맞는 옷</h2>
        <p className="text-muted-foreground text-sm">
          자녀를 등록하면 키에 맞는 사이즈가 판매 중인 상품을 골라 드려요.
        </p>
        <Link to={paths.shop.children} className="text-primary text-sm font-semibold underline">
          자녀 등록하기
        </Link>
      </section>
    )

  return (
    <section ref={ref} aria-label="맞춤 상품" className="scroll-mt-40 space-y-4 md:scroll-mt-28">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-growth-deep text-xs font-bold tracking-widest">
            SIZE {sizeBandOf(child.heightCm).size} IN STOCK
          </p>
          <h2 className="text-2xl font-extrabold">
            {child.name}에게 맞는 옷
            <MockBadge endpoints={['GET /children/:childId/recommended-products']} />
          </h2>
        </div>
        <Link
          to={paths.shop.recommended(child.id)}
          className="text-primary text-sm font-semibold hover:underline"
        >
          더보기 ›
        </Link>
      </div>
      {kids.length > 1 && (
        <ChildPicker
          children={kids}
          selectedId={child.id}
          onSelect={(childId) => childId && onSelectChild(childId)}
          label={(item) => `${item.name} (${item.heightCm}cm)`}
        />
      )}
      {recommended.isPending && <CardGridSkeleton />}
      {recommended.isError && (
        <StateMessage tone="error">{getErrorMessage(recommended.error)}</StateMessage>
      )}
      {recommended.data?.content.length === 0 && (
        <StateMessage>맞는 사이즈가 판매 중인 상품이 없어요.</StateMessage>
      )}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {recommended.data?.content.map((product) => (
          <ProductCard
            key={product.id}
            to={paths.shop.product(product.id, child.id)}
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
    </section>
  )
}
