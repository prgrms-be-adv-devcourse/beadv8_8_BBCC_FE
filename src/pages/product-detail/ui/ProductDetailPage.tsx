import { useState } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { useChildrenQuery } from '@/entities/child'
import { PRODUCT_STATUS_LABEL, useProductQuery } from '@/entities/product'
import { FIT_LABEL, useSizeRecommendationQuery } from '@/entities/recommendation'
import { AddToCartButton } from '@/features/add-to-cart'
import { getErrorMessage } from '@/shared/api'
import { cn, formatWon } from '@/shared/lib'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { PageHeader, StateMessage } from '@/shared/ui/page-header'

export function ProductDetailPage() {
  const { productId = '' } = useParams()
  const [search] = useSearchParams()
  const product = useProductQuery(productId)
  const children = useChildrenQuery()
  const [childId, setChildId] = useState<number | null>(
    search.get('childId') ? Number(search.get('childId')) : null,
  )
  const recommendation = useSizeRecommendationQuery(productId, childId)
  const [optionId, setOptionId] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)

  if (product.isPending) return <StateMessage>불러오는 중…</StateMessage>
  if (product.isError)
    return <StateMessage tone="error">{getErrorMessage(product.error)}</StateMessage>

  const detail = product.data
  const selected = detail.options.find((option) => option.optionId === optionId)
  const onSale = detail.status === 'ON_SALE'

  return (
    <div className="space-y-4">
      <PageHeader
        title={detail.name}
        description={`${detail.categoryName} · ${detail.sellerName} · ${PRODUCT_STATUS_LABEL[detail.status]}`}
      />

      <Card className="border-growth space-y-3">
        <p className="font-semibold">③ 입을 자녀를 고르면 사이즈를 추천해요</p>
        <div className="flex flex-wrap gap-2">
          {children.data?.map((child) => (
            <Button
              key={child.id}
              size="sm"
              variant={childId === child.id ? 'default' : 'outline'}
              onClick={() => setChildId(child.id)}
            >
              {child.name} ({child.heightCm}cm)
            </Button>
          ))}
          {childId !== null && (
            <Button size="sm" variant="ghost" onClick={() => setChildId(null)}>
              자녀 선택 안 함
            </Button>
          )}
        </div>
        {recommendation.isFetching && <StateMessage>추천 계산 중…</StateMessage>}
        {recommendation.isError && (
          <StateMessage tone="error">{getErrorMessage(recommendation.error)}</StateMessage>
        )}
        {recommendation.data && (
          <div className="space-y-1">
            <p>
              {recommendation.data.recommendedSize ? (
                <>
                  추천 사이즈{' '}
                  <Badge variant="highlight">{recommendation.data.recommendedSize}</Badge>{' '}
                  {recommendation.data.fit && (
                    <Badge variant="growth">{FIT_LABEL[recommendation.data.fit]}</Badge>
                  )}
                </>
              ) : (
                '맞는 사이즈가 없어요.'
              )}
            </p>
            <ul className="text-muted-foreground list-disc pl-5 text-xs">
              {recommendation.data.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <Card className="space-y-3">
        <p className="font-semibold">옵션</p>
        <div className="grid grid-cols-2 gap-2">
          {detail.options.map((option) => {
            const isRecommended = option.size === recommendation.data?.recommendedSize
            return (
              <button
                key={option.optionId}
                type="button"
                disabled={option.soldOut}
                onClick={() => setOptionId(option.optionId)}
                className={cn(
                  'rounded-lg border p-2 text-left text-sm disabled:opacity-40',
                  optionId === option.optionId && 'border-primary ring-primary ring-1',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {option.color} / {option.material} / {option.size}
                  </span>
                  {isRecommended && <Badge variant="highlight">추천</Badge>}
                  {option.soldOut && <Badge variant="muted">품절</Badge>}
                </div>
                <div className="text-muted-foreground text-xs">
                  권장 키 {option.minHeightCm}~{option.maxHeightCm}cm · {formatWon(option.price)}
                </div>
              </button>
            )
          })}
        </div>
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
          childId={childId === null ? null : String(childId)}
          quantity={quantity}
          disabled={!onSale}
        />
      </Card>
    </div>
  )
}
