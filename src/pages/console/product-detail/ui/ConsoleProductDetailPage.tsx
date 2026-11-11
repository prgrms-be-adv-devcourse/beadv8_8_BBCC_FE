import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { clampQuantity, MAX_QUANTITY, MIN_QUANTITY } from '@/entities/cart'
import { ChildPicker, useChildrenQuery } from '@/entities/child'
import {
  detailImagesOf,
  isOnSale,
  ProductDescription,
  ProductSellerLine,
  PRODUCT_STATUS_LABEL,
  productMeta,
  missingPickMessage,
  OptionChipPicker,
  optionChipRows,
  pickedOption,
  pickOptionValue,
  type OptionPicks,
  ProductSpecs,
  useProductQuery,
  WearPreview,
} from '@/entities/product'
import {
  type RecommendedPicks,
  SizeRecommendationSummary,
  sizeRangesOf,
  useCompanionProductsQuery,
  useSizeRecommendationQuery,
} from '@/entities/recommendation'
import { useSessionStore } from '@/entities/session'
import { AddToCartButton } from '@/features/add-to-cart'
import { useRecordProductView } from '@/features/record-product-view'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { formatWon } from '@/shared/lib'
import { Card } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StateMessage } from '@/shared/ui/StateMessage'

export function ConsoleProductDetailPage() {
  const { productId = '' } = useParams()
  const [search] = useSearchParams()
  const product = useProductQuery(productId)
  const children = useChildrenQuery()
  const [childId, setChildId] = useState<string | null>(search.get('childId'))
  const recommendation = useSizeRecommendationQuery(productId, childId)
  const companions = useCompanionProductsQuery(productId, childId)
  const user = useSessionStore((state) => state.user)
  useRecordProductView(productId, childId, Boolean(user))
  const [picks, setPicks] = useState<OptionPicks>({})
  const [quantity, setQuantity] = useState(1)

  if (product.isPending) return <StateMessage>불러오는 중…</StateMessage>
  if (product.isError)
    return <StateMessage tone="error">{getErrorMessage(product.error)}</StateMessage>

  const detail = product.data
  const pickedChild = children.data?.find((item) => item.id === childId) ?? null
  const selected = pickedOption(detail, picks)
  const optionId = selected?.id ?? null
  const missingPick = missingPickMessage(detail, picks)
  const isSelling = isOnSale(detail)

  return (
    <div className="space-y-4">
      {/* 상품명(화면 제목) 바로 위 */}
      <ProductSellerLine businessName={detail.businessName} />
      <PageHeader
        title={detail.name}
        description={[productMeta(detail), PRODUCT_STATUS_LABEL[detail.status]]
          .filter(Boolean)
          .join(' · ')}
      />

      <Card className="border-growth space-y-3">
        <p className="font-semibold">③ 입을 자녀를 고르면 사이즈를 추천해요</p>
        <ChildPicker
          children={children.data ?? []}
          selectedId={childId}
          onSelect={setChildId}
          noneLabel={childId !== null ? '자녀 선택 안 함' : undefined}
        />
        {recommendation.isFetching && <StateMessage>추천 계산 중…</StateMessage>}
        {recommendation.isError && (
          <StateMessage tone="error">{getErrorMessage(recommendation.error)}</StateMessage>
        )}
        {recommendation.data && (
          <SizeRecommendationSummary
            recommendation={recommendation.data}
            sizes={sizeRangesOf(detail.sizeSpecs)}
            child={pickedChild}
          />
        )}
        {pickedChild && (
          <WearPreview
            specs={detail.sizeSpecs}
            categoryName={detail.categoryName}
            child={pickedChild}
            initialSize={recommendation.data?.recommendedSize}
          />
        )}
      </Card>

      {childId && (
        <CompanionCard
          childId={childId}
          isPending={companions.isPending}
          isError={companions.isError}
          picks={companions.data}
        />
      )}

      <Card className="space-y-3">
        <p className="font-semibold">옵션</p>
        <OptionChipPicker
          rows={optionChipRows(detail, picks, recommendation.data?.recommendedSize)}
          onPick={(attributeId, valueId) =>
            setPicks((prev) => pickOptionValue(detail, prev, attributeId, valueId))
          }
        />
        {selected && (
          <p className="text-muted-foreground text-sm">
            {selected.name} · {quantity}개
          </p>
        )}
        <div className="flex items-center gap-2">
          <span className="text-sm">수량</span>
          <Input
            type="number"
            min={MIN_QUANTITY}
            max={MAX_QUANTITY}
            className="w-20"
            value={quantity}
            onChange={(e) => setQuantity(clampQuantity(Number(e.target.value)))}
          />
          <span className="ml-auto font-semibold">
            {selected ? formatWon(selected.price * quantity) : missingPick}
          </span>
        </div>
        {!isSelling && <StateMessage tone="error">판매 중인 상품이 아니에요.</StateMessage>}
        <AddToCartButton
          optionId={optionId}
          childId={childId}
          quantity={quantity}
          disabled={!isSelling}
          cartHref={paths.console.cart}
        />
      </Card>

      <Card>
        <ProductSpecs product={detail} recommendedSize={recommendation.data?.recommendedSize} />
      </Card>
      <ProductDescription
        description={detail.description}
        images={detailImagesOf(detail)}
        alt={detail.name}
      />
    </div>
  )
}

type CompanionCardProps = {
  childId: string
  isPending: boolean
  isError: boolean
  /** 그릴 결과 (AI, 없으면 규칙). 그릴 것이 없으면 null */
  picks: RecommendedPicks | null | undefined
}

/** 함께 사면 좋은 상품 (자녀를 골랐을 때). 콘솔은 쇼핑과 달리 빈 결과 · 실패도 문구로 남긴다 */
function CompanionCard({ childId, isPending, isError, picks }: CompanionCardProps) {
  return (
    <Card className="space-y-2">
      <p className="font-semibold">
        함께 사면 좋은 상품
        {picks && (
          <span className="text-muted-foreground ml-2 text-xs">
            {picks.source === 'AI' ? 'AI가 고름' : '규칙으로 고름'}
          </span>
        )}
      </p>
      {isPending && <StateMessage>AI 추천 계산 중… (SSE: 규칙 결과 → AI 답)</StateMessage>}
      {isError && <StateMessage>불러오지 못해 쇼핑 화면에서는 영역을 숨겨요.</StateMessage>}
      {picks === null && <StateMessage>함께 살 만한 상품이 없어요.</StateMessage>}
      <ul className="space-y-1.5 text-sm">
        {picks?.products.map((product) => (
          <li key={product.id}>
            <Link to={paths.console.product(product.id, childId)} className="font-medium underline">
              {product.name}
            </Link>
            {product.recommendedSize && (
              <span className="text-muted-foreground ml-1">{product.recommendedSize}</span>
            )}
            {product.reason && <p className="text-muted-foreground text-xs">{product.reason}</p>}
          </li>
        ))}
      </ul>
    </Card>
  )
}
