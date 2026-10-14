import { useState } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { ChildPicker, useChildrenQuery } from '@/entities/child'
import {
  findOption,
  isOnSale,
  PRODUCT_STATUS_LABEL,
  ProductOptionList,
  useProductQuery,
} from '@/entities/product'
import { SizeRecommendationSummary, useSizeRecommendationQuery } from '@/entities/recommendation'
import { AddToCartButton } from '@/features/add-to-cart'
import { getErrorMessage } from '@/shared/api'
import { formatWon } from '@/shared/lib'
import { Card } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { PageHeader, StateMessage } from '@/shared/ui/page-header'

export function ProductDetailPage() {
  const { productId = '' } = useParams()
  const [search] = useSearchParams()
  const product = useProductQuery(productId)
  const children = useChildrenQuery()
  const [childId, setChildId] = useState<string | null>(search.get('childId'))
  const recommendation = useSizeRecommendationQuery(productId, childId)
  const [optionId, setOptionId] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)

  if (product.isPending) return <StateMessage>불러오는 중…</StateMessage>
  if (product.isError)
    return <StateMessage tone="error">{getErrorMessage(product.error)}</StateMessage>

  const detail = product.data
  const selected = findOption(detail, optionId)
  const onSale = isOnSale(detail)

  return (
    <div className="space-y-4">
      <PageHeader
        title={detail.name}
        description={`${detail.categoryName} · ${detail.sellerName} · ${PRODUCT_STATUS_LABEL[detail.status]}`}
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
        {recommendation.data && <SizeRecommendationSummary recommendation={recommendation.data} />}
      </Card>

      <Card className="space-y-3">
        <p className="font-semibold">옵션</p>
        <ProductOptionList
          options={detail.options}
          selectedId={optionId}
          recommendedSize={recommendation.data?.recommendedSize}
          onSelect={setOptionId}
        />
        <div className="flex items-center gap-2">
          <span className="text-sm">수량</span>
          <Input
            type="number"
            min={1}
            className="w-20"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
          />
          {selected && (
            <span className="ml-auto font-semibold">{formatWon(selected.price * quantity)}</span>
          )}
        </div>
        {!onSale && <StateMessage tone="error">판매 중인 상품이 아니에요.</StateMessage>}
        <AddToCartButton
          optionId={optionId}
          childId={childId}
          quantity={quantity}
          disabled={!onSale}
        />
      </Card>
    </div>
  )
}
