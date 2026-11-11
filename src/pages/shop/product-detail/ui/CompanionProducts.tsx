import { ProductTile } from '@/entities/product'
import type { RecommendedPicks } from '@/entities/recommendation'
import { paths } from '@/shared/config'
import { Skeleton } from '@/shared/ui/Skeleton'

const SLOT_COUNT = 4

type CompanionProductsProps = {
  /** 고른 자녀. 없으면 그리지 않는다 */
  childId: string | null
  isPending: boolean
  /** 실패(504 포함)면 undefined → 영역을 숨긴다 */
  picks: RecommendedPicks | undefined
}

/**
 * 상품 상세 맨 아래 「함께 사면 좋은 상품」: 카드 4칸 + 카드마다 추천 이유.
 * 불러오는 동안 카드 · 이유 자리를 두고, 상품이 없거나 실패하면 영역을 숨긴다. 이유가 없는 카드는 이유 칸을 그리지 않는다
 */
export function CompanionProducts({ childId, isPending, picks }: CompanionProductsProps) {
  if (!childId) return null
  if (!isPending && !picks?.products.length) return null

  return (
    <section aria-labelledby="companion-products" className="space-y-4">
      <h2 id="companion-products" className="text-section">
        함께 사면 좋은 상품
      </h2>
      {isPending ? (
        <div
          role="status"
          aria-label="불러오는 중"
          className="grid grid-cols-2 gap-x-3 gap-y-7 md:grid-cols-4 md:gap-x-4"
        >
          {Array.from({ length: SLOT_COUNT }, (_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="rounded-card aspect-[3/4]" />
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-x-3 gap-y-7 md:grid-cols-4 md:gap-x-4">
          {picks?.products.map((product) => (
            <li key={product.id} className="space-y-2">
              <ProductTile
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
              {product.reason && (
                <p className="text-ink-2 bg-paper-2 rounded-md px-2.5 py-2 text-[13px] leading-snug">
                  {product.reason}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
