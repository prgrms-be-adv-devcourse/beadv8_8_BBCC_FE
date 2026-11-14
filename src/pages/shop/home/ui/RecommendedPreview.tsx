import { Link } from 'react-router'
import { ChildPicker, SizeRulerBar, sizeRulerOf, type Child } from '@/entities/child'
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
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { QuickAdd } from '@/widgets/quick-add'

type RecommendedPreviewProps = {
  kids: Child[]
  child: Child | null
  onSelectChild: (childId: string) => void
}

/**
 * 홈 「{자녀}에게 맞는 옷」: 분홍 색지 바탕에 키 · 추천 사이즈 문장 · 키 눈금자 · 자녀 칩 · 맞춤 상품 4개 · 더보기.
 * 자녀가 없으면 그리지 않는다 (안내는 머리말 띠)
 */
export function RecommendedPreview({ kids, child, onSelectChild }: RecommendedPreviewProps) {
  // 맛보기 4개는 AI가 맞춤 상위 20개 중에서 고르고 이유를 쓴다(SSE). 나머지는 「더보기」(맞춤 목록 화면)에서 본다
  const preview = useHomePreviewQuery(child?.id ?? null)

  if (!child) return null
  const ruler = sizeRulerOf(child.heightCm)
  const waiting = `${child.name}에게 맞는 상품을 고르고 있어요`
  // 규칙 결과가 빈 목록이어도 AI 답을 기다리는 동안은 로딩을 둔다
  const isLoading = preview.isPending || (preview.isWaitingForAi && !preview.data)

  return (
    <section
      aria-label="맞춤 상품"
      className="bg-sheet -mx-4 space-y-6 px-4 py-7 md:mx-0 md:px-8 md:py-9"
    >
      <div className="flex items-start justify-between gap-4">
        <div data-clarity-mask="true" className="space-y-2.5">
          <h2 className="font-display text-[clamp(1.875rem,4vw,3.5rem)] leading-[1.1]">
            {child.name}에게 맞는 옷
          </h2>
          <p className="text-ink text-[15px]">
            키 <span className="figure">{child.heightCm}cm</span>에는{' '}
            <strong className="font-display bg-[linear-gradient(transparent_55%,var(--fit)_55%)] px-[0.12em] text-[1.7em] leading-none font-normal">
              {ruler.band.size}
            </strong>{' '}
            사이즈가 맞아요.
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
          className="text-ink flex min-h-11 shrink-0 items-center gap-0.5 text-sm font-bold underline underline-offset-[3px]"
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
                  <QuickAdd productId={product.id} productName={product.name} childId={child.id} />
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
    </section>
  )
}
