import { Link } from 'react-router'
import { sizeRulerOf, type Child } from '@/entities/child'
import { useFavoritedIdsQuery } from '@/entities/favorite'
import { ProductTile } from '@/entities/product'
import {
  AiSentenceNotice,
  AiWaitingNotice,
  hasAiReasons,
  PickReveal,
  RecommendedPicksLoading,
  RecommendedPicksNotice,
  useHomePreviewQuery,
} from '@/entities/recommendation'
import { FavoriteButton } from '@/features/toggle-favorite'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { QuickAdd } from '@/widgets/quick-add'
import { ChildSwitch } from './ChildSwitch'
import { FitTag } from './FitTag'

type RecommendedPreviewProps = {
  kids: Child[]
  child: Child | null
  onSelectChild: (childId: string) => void
}

/**
 * 홈 「{자녀}에게 맞는 옷」: 옷 태그(이름 · 키 문장 · 더보기)와 추천 사이즈 태그, 맞춤 상품 4개.
 * 자녀가 둘 이상이면 태그의 이름을 눌러 바꾼다.
 * 자녀가 없으면 그리지 않는다 (안내는 머리말 띠)
 */
export function RecommendedPreview({ kids, child, onSelectChild }: RecommendedPreviewProps) {
  // 맛보기 4개는 AI가 맞춤 상위 20개 중에서 고르고 이유를 쓴다(SSE). 나머지는 「더보기」(맞춤 목록 화면)에서 본다
  const preview = useHomePreviewQuery(child?.id ?? null)
  const favoritedIds = useFavoritedIdsQuery(
    preview.data?.products.map((product) => product.id) ?? [],
  )

  if (!child) return null
  const ruler = sizeRulerOf(child.heightCm)
  const waiting = `${child.name}에게 맞는 상품을 고르고 있어요`
  // 규칙 결과가 빈 목록이어도 AI 답을 기다리는 동안은 로딩을 둔다
  const isLoading = preview.isPending || (preview.isWaitingForAi && !preview.data)

  return (
    <section
      aria-label="맞춤 상품"
      className="border-ink -mx-4 grid gap-x-12 gap-y-8 overflow-x-clip border-y-[3px] px-4 pt-12 pb-8 md:mx-0 md:px-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-center"
    >
      {/* 넓은 화면: 왼쪽에 옷 태그, 오른쪽에 맞춤 상품. 좁으면 위아래로 쌓는다 */}
      <FitTag
        title={`${child.name}에게 맞는 옷`}
        name={<ChildSwitch kids={kids} child={child} onSelect={onSelectChild} />}
        size={ruler.band.size}
        footer={
          <Link
            to={paths.shop.recommended(child.id)}
            className="text-ink flex min-h-9 items-center gap-0.5 text-[13px] font-bold underline underline-offset-[3px]"
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
        }
      >
        <p>
          키 <span className="figure">{child.heightCm}cm</span>에 맞는 사이즈예요.
        </p>
        {ruler.roomCm > 0 && (
          <p>
            키가 <span className="figure">{ruler.roomCm}cm</span> 더 클 때까지 입을 수 있어요.
          </p>
        )}
      </FitTag>
      <div className="min-w-0 space-y-4">
        {isLoading && (
          <div className="space-y-3">
            <p className="text-ink-2 text-[13px]">{waiting}</p>
            <RecommendedPicksLoading message={waiting} />
          </div>
        )}
        {preview.isError && (
          <RecommendedPicksNotice onRetry={() => void preview.refetch()}>
            {getErrorMessage(preview.error)}
          </RecommendedPicksNotice>
        )}
        {preview.data === null && !preview.isWaitingForAi && (
          <RecommendedPicksNotice>맞는 사이즈가 판매 중인 상품이 없어요.</RecommendedPicksNotice>
        )}
        {preview.data && preview.isWaitingForAi && (
          <AiWaitingNotice message={`AI가 ${child.name}에게 더 잘 맞는 상품을 고르고 있어요`} />
        )}
        {preview.data && (
          <ul className="grid grid-cols-2 gap-x-3 gap-y-7 md:grid-cols-4 md:gap-x-[18px]">
            {preview.data.products.map((product, index) => (
              <PickReveal key={product.id} index={index} className="space-y-2">
                <ProductTile
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
                  action={
                    <>
                      <FavoriteButton
                        productId={product.id}
                        isFavorited={favoritedIds.data?.has(product.id) ?? false}
                        isLoading={favoritedIds.isPending}
                        isSelling
                        isCompact
                      />
                      <QuickAdd
                        productId={product.id}
                        productName={product.name}
                        childId={child.id}
                      />
                    </>
                  }
                />
                {/* 이유가 없으면(규칙으로 채운 상품) 칸을 그리지 않는다. 길이 제한이 없어 2줄에서 자르고 전문은 title로 */}
                {product.reason && (
                  <p
                    title={product.reason}
                    className="text-ink bg-paper/70 line-clamp-2 px-2.5 py-2 text-[13px] leading-snug"
                  >
                    {product.reason}
                  </p>
                )}
              </PickReveal>
            ))}
          </ul>
        )}
        {preview.data && hasAiReasons(preview.data) && <AiSentenceNotice />}
      </div>
    </section>
  )
}
