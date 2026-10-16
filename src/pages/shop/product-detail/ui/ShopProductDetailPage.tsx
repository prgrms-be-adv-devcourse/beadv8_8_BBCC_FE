import { useState } from 'react'
import { Link, useLocation, useParams, useSearchParams } from 'react-router'
import { clampQuantity, MAX_QUANTITY, MIN_QUANTITY } from '@/entities/cart'
import { ChildPicker, useChildrenQuery } from '@/entities/child'
import {
  findOption,
  isOnSale,
  ProductImage,
  productMeta,
  ProductOptionList,
  ProductSpecs,
  useProductQuery,
  WearPreview,
} from '@/entities/product'
import {
  SizeRecommendationSummary,
  sizeRangesOf,
  useSizeRecommendationQuery,
} from '@/entities/recommendation'
import { useSessionStore } from '@/entities/session'
import { AddToCartButton } from '@/features/add-to-cart'
import { getErrorMessage } from '@/shared/api'
import { loginPath, paths } from '@/shared/config'
import { formatWon } from '@/shared/lib'
import { Card } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Skeleton } from '@/shared/ui/Skeleton'
import { StateMessage } from '@/shared/ui/StateMessage'

export function ShopProductDetailPage() {
  const { productId = '' } = useParams()
  const [search] = useSearchParams()
  const location = useLocation()
  const user = useSessionStore((state) => state.user)
  const product = useProductQuery(productId)
  // 로그인 전에는 자녀를 부르지 않는다 (상품은 누구나 본다)
  const children = useChildrenQuery({ enabled: Boolean(user) })
  const [childId, setChildId] = useState<string | null>(search.get('childId'))
  const recommendation = useSizeRecommendationQuery(productId, childId)
  const [optionId, setOptionId] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)

  if (product.isPending)
    return (
      <div role="status" aria-label="불러오는 중" className="grid gap-6 md:grid-cols-2">
        <Skeleton className="aspect-square rounded-2xl" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    )
  if (product.isError)
    return <StateMessage tone="error">{getErrorMessage(product.error)}</StateMessage>

  const detail = product.data
  const pickedChild = children.data?.find((item) => item.id === childId) ?? null
  const selected = findOption(detail, optionId)
  const isSelling = isOnSale(detail)

  return (
    <div className="space-y-4">
      <Link to={paths.shop.home} className="text-muted-foreground text-sm hover:underline">
        ← 상품 목록
      </Link>
      <div className="grid gap-8 md:grid-cols-2">
        <ProductImage
          src={detail.imageUrl}
          alt={detail.name}
          className="aspect-square rounded-2xl"
        />

        <div className="space-y-5">
          <div>
            <p className="text-muted-foreground text-sm">{productMeta(detail)}</p>
            <h1 className="mt-1 text-2xl font-bold">{detail.name}</h1>
            {detail.minPrice !== null && (
              <p className="mt-2 text-2xl font-extrabold">{formatWon(detail.minPrice)}~</p>
            )}
          </div>

          <Card className="border-growth space-y-3">
            <p className="font-semibold">누가 입나요? 자녀를 고르면 사이즈를 추천해요</p>
            {!user ? (
              <Link
                to={loginPath(location.pathname + location.search)}
                className="text-primary text-sm underline"
              >
                로그인하면 자녀별 추천 사이즈를 알려 드려요
              </Link>
            ) : children.data?.length === 0 ? (
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
              <SizeRecommendationSummary
                recommendation={recommendation.data}
                sizes={sizeRangesOf(detail.sizeSpecs)}
                child={pickedChild}
              />
            )}
            {pickedChild && (
              <WearPreview
                specs={detail.sizeSpecs}
                child={pickedChild}
                initialSize={recommendation.data?.recommendedSize}
              />
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

          <ProductSpecs product={detail} />

          {/* 휴대폰에서는 수량 · 금액 · 담기를 화면 아래에 고정한다 */}
          <div className="sticky bottom-0 -mx-4 space-y-3 border-t bg-white/95 px-4 pt-3 pb-4 backdrop-blur md:static md:mx-0 md:bg-transparent md:px-0 md:pb-0 md:backdrop-blur-none">
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
              <span className="ml-auto text-xl font-extrabold">
                {selected ? formatWon(selected.price * quantity) : '옵션을 골라 주세요'}
              </span>
            </div>
            {!isSelling && <StateMessage tone="error">판매 중인 상품이 아니에요.</StateMessage>}
            {user ? (
              <AddToCartButton
                optionId={optionId}
                childId={childId}
                quantity={quantity}
                disabled={!isSelling}
                cartHref={paths.shop.cart}
                continueHref={paths.shop.home}
              />
            ) : (
              <Link
                to={loginPath(location.pathname + location.search)}
                className="bg-primary text-primary-foreground block rounded-lg py-3 text-center font-semibold"
              >
                로그인하고 담기
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
