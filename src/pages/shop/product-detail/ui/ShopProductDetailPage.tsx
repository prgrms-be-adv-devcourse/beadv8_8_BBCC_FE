import { useState } from 'react'
import { Link, useLocation, useParams, useSearchParams } from 'react-router'
import { clampQuantity, MAX_QUANTITY, MIN_QUANTITY } from '@/entities/cart'
import { ChildPicker, useChildrenQuery } from '@/entities/child'
import {
  detailImagesOf,
  isOnSale,
  ProductDescription,
  ProductGallery,
  ProductSellerLine,
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
import { sizeRangesOf, useSizeRecommendationQuery } from '@/entities/recommendation'
import { useSessionStore } from '@/entities/session'
import { AddToCartButton } from '@/features/add-to-cart'
import { getErrorMessage } from '@/shared/api'
import { loginPath, paths } from '@/shared/config'
import { formatWon } from '@/shared/lib'
import { Input } from '@/shared/ui/input'
import { Skeleton } from '@/shared/ui/Skeleton'
import { StateMessage } from '@/shared/ui/StateMessage'
import { SizeAdvice } from './SizeAdvice'

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
  const [picks, setPicks] = useState<OptionPicks>({})
  const [quantity, setQuantity] = useState(1)

  if (product.isPending)
    return (
      <div role="status" aria-label="불러오는 중" className="grid gap-6 md:grid-cols-2">
        <Skeleton className="rounded-card aspect-square" />
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
  const selected = pickedOption(detail, picks)
  const optionId = selected?.id ?? null
  const missingPick = missingPickMessage(detail, picks)
  const isSelling = isOnSale(detail)
  // 추천 한 줄은 사이즈 칩 바로 위에 (사이즈 항목이 없는 상품이면 옵션 맨 위)
  const sizeAttributeId = detail.optionAttributes.find((attribute) => attribute.isSize)?.id ?? null
  const sizeAdvice = (
    <>
      {recommendation.isFetching && <StateMessage>추천 계산 중…</StateMessage>}
      {recommendation.isError && (
        <StateMessage tone="error">{getErrorMessage(recommendation.error)}</StateMessage>
      )}
      {pickedChild && recommendation.data && (
        <SizeAdvice
          child={pickedChild}
          recommendation={recommendation.data}
          sizes={sizeRangesOf(detail.sizeSpecs)}
          preview={
            <WearPreview
              specs={detail.sizeSpecs}
              child={pickedChild}
              initialSize={recommendation.data.recommendedSize}
              isCompact
            />
          }
        />
      )}
    </>
  )

  return (
    <div className="shop-look space-y-14 md:space-y-24">
      <section aria-label={detail.name} className="space-y-4">
        <Link
          to={paths.shop.home}
          className="text-ink-3 hover:text-ink inline-flex items-center gap-1 rounded-md text-[13px] font-semibold transition-colors"
        >
          <svg
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          상품 목록
        </Link>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12">
          <ProductGallery
            images={detail.imageUrls}
            alt={detail.name}
            className="rounded-card max-lg:aspect-[4/3]"
          />

          <div className="shop-offer space-y-5">
            {/* 셀러 마켓 상세: 상점 줄을 맨 위에 두고, 카테고리 · 이름 · 가격 순서 */}
            <div className="space-y-2">
              {detail.businessName && (
                <div className="border-rule border-b pb-3">
                  <ProductSellerLine businessName={detail.businessName} />
                </div>
              )}
              <p className="text-ink-3 pt-1 text-[13px]">{productMeta(detail)}</p>
              <h1 className="text-page">{detail.name}</h1>
              {detail.minPrice !== null && (
                <p className="figure pt-1 text-2xl font-bold">{formatWon(detail.minPrice)}~</p>
              )}
            </div>

            {/* 옵션: 누가 입나요(주문에 같이 실린다) → 색상 → 추천 한 줄 → 사이즈 칩 */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <p className="text-sm font-semibold">누가 입나요?</p>
                {!user ? (
                  <Link
                    to={loginPath(location.pathname + location.search)}
                    className="shop-link text-sm"
                  >
                    로그인하고 맞는 사이즈 보기
                  </Link>
                ) : children.data?.length === 0 ? (
                  <Link to={paths.shop.childNew} className="shop-link text-sm">
                    자녀 등록하고 맞는 사이즈 보기
                  </Link>
                ) : (
                  <ChildPicker
                    children={children.data ?? []}
                    selectedId={childId}
                    onSelect={setChildId}
                    noneLabel={childId !== null ? '선택 안 함' : undefined}
                  />
                )}
              </div>
              {!sizeAttributeId && sizeAdvice}
              <OptionChipPicker
                rows={optionChipRows(detail, picks, recommendation.data?.recommendedSize)}
                onPick={(attributeId, valueId) =>
                  setPicks((prev) => pickOptionValue(detail, prev, attributeId, valueId))
                }
                aboveRow={sizeAttributeId ? { [sizeAttributeId]: sizeAdvice } : undefined}
              />
              {selected && (
                <p className="text-ink-2 text-sm">
                  {selected.name} · {quantity}개
                </p>
              )}
            </div>

            {/* 휴대폰에서는 수량 · 금액 · 담기를 화면 아래에 고정한다 */}
            <div className="border-rule bg-paper/95 sticky bottom-0 -mx-4 space-y-3 border-t px-4 pt-3 pb-3 backdrop-blur md:static md:mx-0 md:bg-transparent md:px-0 md:pt-4 md:pb-0 md:backdrop-blur-none">
              <div className="flex items-center gap-3">
                <span className="text-ink-2 text-sm">수량</span>
                <Input
                  type="number"
                  min={MIN_QUANTITY}
                  max={MAX_QUANTITY}
                  className="h-11 w-20 text-base"
                  value={quantity}
                  onChange={(e) => setQuantity(clampQuantity(Number(e.target.value)))}
                />
                <span
                  className={
                    selected
                      ? 'figure ml-auto text-right text-xl font-bold'
                      : 'text-ink-2 ml-auto text-right text-sm'
                  }
                >
                  {selected ? formatWon(selected.price * quantity) : missingPick}
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
                  className="shop-btn w-full"
                >
                  로그인하고 담기
                </Link>
              )}
            </div>

            {/* 소재 · 실측표는 담기 아래에 둔다 (담기 버튼이 첫 화면 안에 오도록) */}
            <ProductSpecs product={detail} recommendedSize={recommendation.data?.recommendedSize} />
          </div>
        </div>
      </section>
      <ProductDescription
        description={detail.description}
        images={detailImagesOf(detail)}
        alt={detail.name}
      />
    </div>
  )
}
