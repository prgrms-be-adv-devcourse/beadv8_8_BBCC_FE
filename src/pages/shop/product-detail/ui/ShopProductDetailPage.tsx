import { useRef, useState } from 'react'
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
  picksOfOption,
  type OptionPicks,
  ProductSpecs,
  useCategoriesQuery,
  useProductQuery,
  WearPreview,
} from '@/entities/product'
import {
  GARMENT_PART_SPEC,
  referencePartToRegister,
  sizeRangesOf,
  useCompanionProductsQuery,
  useReferenceGarmentsQuery,
  useSizeRecommendationQuery,
} from '@/entities/recommendation'
import { useFavoritedIdsQuery, useFavoriteSummaryQuery } from '@/entities/favorite'
import { useSessionStore } from '@/entities/session'
import { AddToCartButton } from '@/features/add-to-cart'
import { ChildWishAddButton } from '@/features/child-wish-cart'
import { useRecordProductView } from '@/features/record-product-view'
import { FavoriteButton } from '@/features/toggle-favorite'
import { getErrorMessage } from '@/shared/api'
import { loginPath, paths } from '@/shared/config'
import { formatWon, useArea } from '@/shared/lib'
import { Input } from '@/shared/ui/input'
import { Skeleton } from '@/shared/ui/Skeleton'
import { StateMessage } from '@/shared/ui/StateMessage'
import { CompanionProducts } from './CompanionProducts'
import { ProductReviews } from './ProductReviews'
import { SizeAdvice } from './SizeAdvice'

export function ShopProductDetailPage() {
  const isChild = useArea() === 'child'
  const { productId = '' } = useParams()
  const [search] = useSearchParams()
  const location = useLocation()
  const user = useSessionStore((state) => state.user)
  const product = useProductQuery(productId)
  // 로그인 전에는 자녀를 부르지 않는다 (상품은 누구나 본다)
  const children = useChildrenQuery({ enabled: Boolean(user) && !isChild })
  const [childId, setChildId] = useState<string | null>(search.get('childId'))
  // 사이즈 추천은 로그인한 보호자가 자녀를 골랐을 때만 (자녀가 붙은 주소로 로그인 전에 들어와도 부르지 않는다)
  const recommendedChildId = user && !isChild ? childId : null
  const recommendation = useSizeRecommendationQuery(productId, recommendedChildId)
  // 함께 사면 좋은 상품은 AI 응답이 3초 가까이 걸려, 영역이 보일 때가 아니라 상세와 함께 바로 부른다
  const companions = useCompanionProductsQuery(productId, recommendedChildId)
  // 기준 옷 등록 안내: 고른 자녀의 기준 옷 · 카테고리 경로(구분을 정함)
  const garments = useReferenceGarmentsQuery(recommendedChildId)
  const categories = useCategoriesQuery()
  // 보호자 회원만 기록한다 (자녀 화면은 자녀 토큰이라 부르지 않음)
  useRecordProductView(productId, childId, Boolean(user) && !isChild)
  // 찜 수는 누구나, 내가 찜했는지는 로그인한 보호자만 (자녀 화면은 하트를 그리지 않음)
  const favoriteSummary = useFavoriteSummaryQuery(isChild ? '' : productId)
  const favoritedIds = useFavoritedIdsQuery([productId], { enabled: Boolean(user) && !isChild })
  // 로그인하고 돌아오면 주소(?option=&qty=)에 실어 둔 옵션 · 수량으로 시작한다. 고르기 전까지는 null
  const [pickedByUser, setPicks] = useState<OptionPicks | null>(null)
  const [quantityByUser, setQuantity] = useState<number | null>(null)
  const [showsPickHint, setShowsPickHint] = useState(false)
  const optionsRef = useRef<HTMLDivElement>(null)

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
  const picks = pickedByUser ?? picksOfOption(detail, search.get('option'))
  const quantity = quantityByUser ?? clampQuantity(Number(search.get('qty')) || MIN_QUANTITY)
  const pickedChild = children.data?.find((item) => item.id === childId) ?? null
  const selected = pickedOption(detail, picks)
  const optionId = selected?.id ?? null
  const missingPick = missingPickMessage(detail, picks)
  const isSelling = isOnSale(detail)
  // 추천 한 줄은 사이즈 칩 바로 위에 (사이즈 항목이 없는 상품이면 옵션 맨 위)
  const sizeAttributeId = detail.optionAttributes.find((attribute) => attribute.isSize)?.id ?? null
  const categoryPath = categories.data?.find((c) => c.id === detail.categoryId)?.path ?? null
  const partToRegister =
    pickedChild && garments.data
      ? referencePartToRegister(categoryPath, detail.sizeFree, garments.data)
      : null
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
          referenceGarmentLink={
            partToRegister && {
              label: `${GARMENT_PART_SPEC[partToRegister].label} 기준 옷 적기`,
              to: paths.shop.childReferenceGarments(pickedChild.id),
            }
          }
          preview={
            <WearPreview
              specs={detail.sizeSpecs}
              categoryName={detail.categoryName}
              child={pickedChild}
              initialSize={recommendation.data.recommendedSize}
              isCompact
            />
          }
        />
      )}
    </>
  )

  /** 로그인 뒤 돌아올 주소: 고른 옵션 · 수량을 실어 되살린다 */
  const returnPath = () => {
    const params = new URLSearchParams(location.search)
    params.delete('option')
    params.delete('qty')
    if (optionId) params.set('option', optionId)
    if (optionId && quantity !== MIN_QUANTITY) params.set('qty', String(quantity))
    const query = params.toString()
    return location.pathname + (query ? `?${query}` : '')
  }
  /** 옵션을 다 고르지 않았으면 담기 대신 옵션으로 데려간다 */
  const askToPick = () => {
    setShowsPickHint(true)
    optionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <div className="shop-look space-y-14 md:space-y-24">
      <section aria-label={detail.name} className="space-y-4">
        <Link
          to={isChild ? paths.child.products : paths.shop.home}
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
            className="rounded-card min-w-0 max-lg:aspect-[4/3]"
          />

          {/* min-w-0: 실측표처럼 넓은 표가 열을 넓혀 가격 · 담기 버튼을 화면 밖으로 밀지 않게 (표만 가로로 민다) */}
          <div className="shop-offer min-w-0 space-y-5">
            {/* 셀러 마켓 상세: 상점 줄을 맨 위에 두고, 카테고리 · 이름 · 가격 순서 */}
            <div className="space-y-2">
              {detail.businessName && (
                <div className="border-rule border-b pb-3">
                  <ProductSellerLine businessName={detail.businessName} />
                </div>
              )}
              <p className="text-ink-3 pt-1 text-[13px]">{productMeta(detail)}</p>
              {isChild ? (
                <h1 className="text-page">{detail.name}</h1>
              ) : (
                <div className="flex items-start gap-3">
                  <h1 className="text-page min-w-0 flex-1">{detail.name}</h1>
                  <FavoriteButton
                    productId={detail.id}
                    isFavorited={favoritedIds.data?.has(detail.id) ?? false}
                    isLoading={Boolean(user) && favoritedIds.isPending}
                    count={favoriteSummary.data?.count}
                    isSelling={isSelling}
                    loginHref={user ? null : loginPath(returnPath())}
                  />
                </div>
              )}
              {detail.minPrice !== null && (
                <p className="figure pt-1 text-2xl font-bold">{formatWon(detail.minPrice)}~</p>
              )}
            </div>

            {/* 옵션: 누가 입나요(주문에 같이 실린다) → 색상 → 추천 한 줄 → 사이즈 칩 */}
            <div ref={optionsRef} className="scroll-mt-24 space-y-3">
              {!isChild && (
                <div className="space-y-1.5">
                  <p className="text-sm font-semibold">누가 입나요?</p>
                  {!user ? (
                    <Link to={loginPath(returnPath())} className="shop-link text-sm">
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
              )}
              {!sizeAttributeId && sizeAdvice}
              <OptionChipPicker
                rows={optionChipRows(detail, picks, recommendation.data?.recommendedSize)}
                onPick={(attributeId, valueId) =>
                  setPicks(pickOptionValue(detail, picks, attributeId, valueId))
                }
                aboveRow={sizeAttributeId ? { [sizeAttributeId]: sizeAdvice } : undefined}
              />
              {selected && (
                <p className="text-ink-2 text-sm">
                  {selected.name} · {quantity}개
                </p>
              )}
              {showsPickHint && missingPick && (
                <p role="alert" className="text-destructive text-sm font-semibold">
                  {missingPick}
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
              {isChild ? (
                <ChildWishAddButton optionId={optionId} quantity={quantity} disabled={!isSelling} />
              ) : user ? (
                <AddToCartButton
                  optionId={optionId}
                  childId={childId}
                  quantity={quantity}
                  disabled={!isSelling}
                  cartHref={paths.shop.cart}
                  continueHref={paths.shop.home}
                />
              ) : selected ? (
                <Link to={loginPath(returnPath())} className="shop-btn w-full">
                  로그인하고 담기
                </Link>
              ) : (
                <button type="button" className="shop-btn w-full" onClick={askToPick}>
                  로그인하고 담기
                </button>
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
        isCollapsible
      />
      <ProductReviews productId={detail.id} />
      <CompanionProducts
        childId={recommendedChildId}
        isPending={companions.isPending}
        isError={companions.isError}
        picks={companions.data}
        onRetry={() => void companions.refetch()}
      />
    </div>
  )
}
