import { ProductTile } from '@/entities/product'
import {
  PickReveal,
  RecommendedPicksSkeleton,
  type RecommendedPicks,
} from '@/entities/recommendation'
import { paths } from '@/shared/config'

type CompanionProductsProps = {
  /** 고른 자녀. 없으면 그리지 않는다 */
  childId: string | null
  isPending: boolean
  /** 그릴 결과(AI, 없으면 규칙). 그릴 것이 없거나(null) 실패(undefined)면 영역을 숨긴다 */
  picks: RecommendedPicks | null | undefined
}

/**
 * 상품 상세 맨 아래 「함께 사면 좋은 상품」: 카드 4칸 + 카드마다 추천 이유.
 * AI 답을 기다리는 동안 제목 · 안내 · 빛이 지나가는 자리를 두고, 답이 오면 카드가 차례로 나타난다.
 * 상품이 없거나 실패하면 영역을 숨긴다. 이유가 없는 카드는 이유 칸을 그리지 않는다
 */
export function CompanionProducts({ childId, isPending, picks }: CompanionProductsProps) {
  if (!childId) return null
  if (!isPending && !picks) return null

  return (
    <section aria-labelledby="companion-products" className="space-y-4">
      <h2 id="companion-products" className="text-section">
        함께 사면 좋은 상품
      </h2>
      {isPending || !picks ? (
        <RecommendedPicksSkeleton message="함께 입기 좋은 상품을 고르고 있어요" />
      ) : (
        <ul className="grid grid-cols-2 gap-x-3 gap-y-7 md:grid-cols-4 md:gap-x-4">
          {picks.products.map((product, index) => (
            <PickReveal key={product.id} index={index} className="space-y-2">
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
            </PickReveal>
          ))}
        </ul>
      )}
    </section>
  )
}
