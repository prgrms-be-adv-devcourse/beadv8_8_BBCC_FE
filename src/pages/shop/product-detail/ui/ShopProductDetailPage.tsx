import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { ChildPicker, useChildrenQuery } from '@/entities/child'
import { findOption, isOnSale, ProductOptionList, useProductQuery } from '@/entities/product'
import { SizeRecommendationSummary, useSizeRecommendationQuery } from '@/entities/recommendation'
import { AddToCartButton } from '@/features/add-to-cart'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { formatWon } from '@/shared/lib'
import { Card } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { StateMessage } from '@/shared/ui/StateMessage'

export function ShopProductDetailPage() {
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
  const isSelling = isOnSale(detail)

  return (
    <div className="space-y-4">
      <Link to={paths.shop.home} className="text-muted-foreground text-sm hover:underline">
        ← 상품 목록
      </Link>
      <div className="grid gap-8 md:grid-cols-2">
        <div className="bg-muted text-muted-foreground flex aspect-square items-center justify-center rounded-2xl">
          상품 이미지
        </div>

        <div className="space-y-5">
          <div>
            <p className="text-muted-foreground text-sm">
              {detail.sellerName} · {detail.categoryName}
            </p>
            <h1 className="mt-1 text-2xl font-bold">{detail.name}</h1>
            <p className="mt-2 text-2xl font-extrabold">{formatWon(detail.minPrice)}~</p>
            {detail.description && (
              <p className="text-muted-foreground mt-2 text-sm">{detail.description}</p>
            )}
          </div>

          <Card className="border-growth space-y-3">
            <p className="font-semibold">누가 입나요? 자녀를 고르면 사이즈를 추천해요</p>
            {children.data?.length === 0 ? (
              <Link to={paths.shop.children} className="text-primary text-sm underline">
                자녀를 등록하면 맞는 사이즈를 알려 드려요
              </Link>
            ) : (
              <ChildPicker
                children={children.data ?? []}
                selectedId={childId}
                onSelect={setChildId}
                noneLabel={childId !== null ? '선택 안 함' : undefined}
              />
            )}
            {recommendation.isFetching && <StateMessage>추천 계산 중…</StateMessage>}
            {recommendation.isError && (
              <StateMessage tone="error">{getErrorMessage(recommendation.error)}</StateMessage>
            )}
            {recommendation.data && (
              <SizeRecommendationSummary recommendation={recommendation.data} />
            )}
          </Card>

          <div className="space-y-2">
            <p className="font-semibold">옵션</p>
            <ProductOptionList
              options={detail.options}
              selectedId={optionId}
              recommendedSize={recommendation.data?.recommendedSize}
              onSelect={setOptionId}
            />
          </div>

          <div className="flex items-center gap-2 border-t pt-4">
            <span className="text-sm">수량</span>
            <Input
              type="number"
              min={1}
              className="w-20"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            />
            <span className="ml-auto text-xl font-extrabold">
              {selected ? formatWon(selected.price * quantity) : '옵션을 골라 주세요'}
            </span>
          </div>
          {!isSelling && <StateMessage tone="error">판매 중인 상품이 아니에요.</StateMessage>}
          <AddToCartButton
            optionId={optionId}
            childId={childId}
            quantity={quantity}
            disabled={!isSelling}
            cartHref={paths.shop.cart}
          />
        </div>
      </div>
    </div>
  )
}
