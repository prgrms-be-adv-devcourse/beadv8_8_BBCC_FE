import { Link } from 'react-router'
import { ChildPicker, SizeRulerBar, sizeRulerOf, type Child } from '@/entities/child'
import { ProductTile } from '@/entities/product'
import { useRecommendedProductsQuery } from '@/entities/recommendation'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { MockBadge } from '@/shared/ui/MockBadge'
import { CardGridSkeleton } from '@/shared/ui/Skeleton'
import { StateMessage } from '@/shared/ui/StateMessage'

/** 홈 맞춤 영역은 맛보기로 4개만 보이고, 나머지는 「더보기」(맞춤 목록 화면)에서 본다 */
const PREVIEW_SIZE = 4

type RecommendedPreviewProps = {
  kids: Child[]
  child: Child | null
  onSelectChild: (childId: string) => void
}

/**
 * 홈 「{자녀}에게 맞는 옷」: 가는 테두리 안에 키 · 추천 사이즈 문장 · 키 눈금자 · 자녀 칩 · 맞춤 상품 4개 · 더보기.
 * 자녀가 없으면 그리지 않는다 (안내는 머리말 띠)
 */
export function RecommendedPreview({ kids, child, onSelectChild }: RecommendedPreviewProps) {
  const recommended = useRecommendedProductsQuery(child?.id ?? null, { size: PREVIEW_SIZE })

  if (!child) return null
  const ruler = sizeRulerOf(child.heightCm)

  return (
    <section aria-label="맞춤 상품" className="border-rule space-y-5 rounded-lg border p-4 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-section">
            {child.name}에게 맞는 옷
            <MockBadge endpoints={['GET /children/:childId/recommended-products']} />
          </h2>
          <p className="text-ink-2 text-[13px]">
            키 <span className="figure">{child.heightCm}cm</span>에는{' '}
            <strong className="text-fit-ink figure font-bold">{ruler.band.size}</strong> 사이즈가
            맞아요.
            {ruler.roomCm > 0 && (
              <>
                {' '}
                앞으로 <span className="figure">{ruler.roomCm}cm</span> 더 입을 수 있어요.
              </>
            )}
          </p>
        </div>
        <Link
          to={paths.shop.recommended(child.id)}
          className="text-ink-2 hover:text-ink flex min-h-11 shrink-0 items-center gap-0.5 text-[13px] font-semibold transition-colors"
        >
          더보기
          <svg
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <path d="m9 6 6 6-6 6" />
          </svg>
        </Link>
      </div>
      {/* 넓은 화면: 왼쪽 자녀 칩 · 오른쪽 키 눈금자. 휴대폰은 눈금자가 먼저 */}
      <div className="grid gap-x-10 gap-y-3 md:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] md:items-end">
        <div className="max-md:order-last">
          {kids.length > 1 && (
            <ChildPicker
              children={kids}
              selectedId={child.id}
              onSelect={(childId) => childId && onSelectChild(childId)}
              label={(item) => `${item.name} (${item.heightCm}cm)`}
            />
          )}
        </div>
        <SizeRulerBar ruler={ruler} name={child.name} />
      </div>
      {recommended.isPending && <CardGridSkeleton />}
      {recommended.isError && (
        <StateMessage tone="error">{getErrorMessage(recommended.error)}</StateMessage>
      )}
      {recommended.data?.content.length === 0 && (
        <StateMessage>맞는 사이즈가 판매 중인 상품이 없어요.</StateMessage>
      )}
      <div className="grid grid-cols-2 gap-x-3 gap-y-7 md:grid-cols-4 md:gap-x-4">
        {recommended.data?.content.map((product) => (
          <ProductTile
            key={product.id}
            to={paths.shop.product(product.id, child.id)}
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
    </section>
  )
}
