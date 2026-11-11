import { ProductTile } from '@/entities/product'
import {
  PickReveal,
  RecommendedPicksLoading,
  RecommendedPicksNotice,
  type RecommendedPicks,
} from '@/entities/recommendation'
import { paths } from '@/shared/config'

const WAITING = '함께 입기 좋은 상품을 고르고 있어요'

type CompanionProductsProps = {
  /** 고른 자녀. 없으면 그리지 않는다 */
  childId: string | null
  isPending: boolean
  isError: boolean
  /** 그릴 결과(AI, 없으면 규칙). 함께 볼 상품이 없으면 null */
  picks: RecommendedPicks | null | undefined
  onRetry: () => void
}

/**
 * 상품 상세 맨 아래 「함께 사면 좋은 상품」: 카드 4칸 + 카드마다 추천 이유.
 * AI 답을 기다리는 동안 카드 칸마다 원형 로딩을 두고, 답이 오면 그 자리에서 부드럽게 나타난다.
 * 불러오지 못했거나 함께 볼 상품이 없어도 영역을 남기고 안내한다. 이유가 없는 카드는 이유 칸을 그리지 않는다
 */
export function CompanionProducts({
  childId,
  isPending,
  isError,
  picks,
  onRetry,
}: CompanionProductsProps) {
  if (!childId) return null

  return (
    <section aria-labelledby="companion-products" className="space-y-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 id="companion-products" className="text-section">
          함께 사면 좋은 상품
        </h2>
        {isPending && <span className="text-ink-2 text-[13px]">{WAITING}</span>}
      </div>
      {isPending ? (
        <RecommendedPicksLoading message={WAITING} />
      ) : isError ? (
        <RecommendedPicksNotice onRetry={onRetry}>
          지금은 함께 볼 상품을 불러오지 못했어요
        </RecommendedPicksNotice>
      ) : !picks ? (
        <RecommendedPicksNotice>이 상품과 함께 볼 만한 상품이 아직 없어요</RecommendedPicksNotice>
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
