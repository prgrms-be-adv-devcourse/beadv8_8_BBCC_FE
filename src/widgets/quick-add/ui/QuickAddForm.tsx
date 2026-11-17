import { useState } from 'react'
import { Link } from 'react-router'
import { MIN_QUANTITY } from '@/entities/cart'
import { ChildPicker, useChildrenQuery } from '@/entities/child'
import {
  ALL_CATEGORIES_ICON,
  categoryIconOf,
  hasPriceRange,
  isOnSale,
  OptionChipPicker,
  ProductImage,
  ProductSpecs,
  useCategoriesQuery,
  useOptionPicks,
  type ProductDetail,
} from '@/entities/product'
import { useArrivedAfterWait, useSizeRecommendationQuery } from '@/entities/recommendation'
import { useSessionStore } from '@/entities/session'
import { useRecordProductView } from '@/features/record-product-view'
import { getErrorMessage } from '@/shared/api'
import { loginPath, paths } from '@/shared/config'
import { formatWon, useArea } from '@/shared/lib'
import { isQuickSizeWaiting, quickRecommendedSizeOf } from '../model/quick-size.rules'
import { quickAddReturnPath } from '../model/return-path'
import { QuickAddActions } from './QuickAddActions'
import { QuickSizeLine } from './QuickSizeLine'

type QuickAddFormProps = {
  detail: ProductDetail
  initialChildId: string | null
  onClose: () => void
}

const PHOTO = 'border-ink aspect-[4/5] border-[1.5px]'

/**
 * 담기 팝업의 옵션 고르기: 사진 · 이름 · 가격 → 누가 입나요 → 추천 한 줄 → 색 · 사이즈 → 소재 · 실측표 → 수량 · 담기.
 * 추천 사이즈는 칩에 표시만 하고 대신 고르지 않는다. 추천 한 줄과 칩의 「추천」은 AI 답이 오거나 스트림이 닫힌 뒤에 함께 나타난다.
 * 팝업을 열면 조회(QUICK)로 기록한다
 */
export function QuickAddForm({ detail, initialChildId, onClose }: QuickAddFormProps) {
  const isChild = useArea() === 'child'
  const user = useSessionStore((state) => state.user)
  // 로그인 전에는 자녀를 부르지 않는다 (상품은 누구나 본다)
  const children = useChildrenQuery({ enabled: Boolean(user) && !isChild })
  const categories = useCategoriesQuery()
  const [childId, setChildId] = useState<string | null>(initialChildId)
  // 사이즈 추천은 로그인한 보호자가 자녀를 골랐을 때만
  const recommendedChildId = user && !isChild ? childId : null
  const recommendation = useSizeRecommendationQuery(detail.id, recommendedChildId)
  // 팝업은 규칙 결과를 먼저 그리지 않는다. 상세에서 규칙 결과만 받은 채 열어도 「추천 계산 중」이다
  const isSizeWaiting = isQuickSizeWaiting(recommendation)
  const isSizeArrival = useArrivedAfterWait(isSizeWaiting, `${detail.id}:${recommendedChildId}`)
  const recommendedSize = quickRecommendedSizeOf(recommendation.data, isSizeWaiting)
  const options = useOptionPicks(detail)
  const [quantity, setQuantity] = useState(MIN_QUANTITY)
  // 팝업을 연 것은 상세 진입보다 낮은 무게의 조회로 기록한다. 보호자 회원만 (자녀 화면은 자녀 토큰이라 부르지 않음)
  useRecordProductView(detail.id, childId, Boolean(user) && !isChild, 'QUICK')

  const pickedChild = children.data?.find((item) => item.id === childId) ?? null
  const category = categories.data?.find((item) => item.id === detail.categoryId) ?? null
  const doodle = (category && categoryIconOf(category.name)) || ALL_CATEGORIES_ICON
  const detailHref = isChild
    ? paths.child.product(detail.id)
    : paths.shop.product(detail.id, childId)
  const loginHref = loginPath(
    quickAddReturnPath(detailHref, options.selected?.id ?? null, quantity),
  )
  // 추천 한 줄은 사이즈 칩 바로 위에 (사이즈 항목이 없는 상품이면 옵션 맨 위)
  const sizeAttributeId = detail.optionAttributes.find((attribute) => attribute.isSize)?.id ?? null
  const sizeLine = pickedChild && (
    <QuickSizeLine
      child={pickedChild}
      recommendation={recommendation.data}
      isWaiting={isSizeWaiting}
      isArrival={isSizeArrival}
      errorMessage={recommendation.isError ? getErrorMessage(recommendation.error) : null}
    />
  )

  return (
    <div className="grid md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <div className="border-ink p-6 max-md:hidden md:border-r-[1.5px]">
        <ProductImage
          src={detail.imageUrls[0] ?? null}
          alt={detail.name}
          doodle={doodle}
          className={PHOTO}
        />
      </div>
      <div className="flex min-w-0 flex-col">
        <div className="space-y-4 p-4 md:p-6">
          <div className="flex items-start gap-3">
            <div className="w-20 shrink-0 md:hidden">
              <ProductImage
                src={detail.imageUrls[0] ?? null}
                alt=""
                doodle={doodle}
                className={PHOTO}
              />
            </div>
            <div className="min-w-0 space-y-1.5">
              {detail.businessName && <p className="text-ink-3 text-xs">{detail.businessName}</p>}
              <p className="font-display text-2xl leading-tight md:text-[28px]">{detail.name}</p>
              {detail.minPrice !== null && (
                <p className="figure text-2xl leading-none font-bold">
                  {formatWon(detail.minPrice)}
                  {hasPriceRange(detail.options) && '~'}
                </p>
              )}
            </div>
          </div>
          {!isChild && (
            <div className="space-y-1.5">
              <p className="text-[13px] font-bold">누가 입나요?</p>
              {!user ? (
                <Link to={loginPath(detailHref)} className="shop-link text-sm">
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
          {!sizeAttributeId && sizeLine}
          <OptionChipPicker
            rows={options.rowsFor(recommendedSize)}
            onPick={options.pick}
            aboveRow={sizeAttributeId && sizeLine ? { [sizeAttributeId]: sizeLine } : undefined}
            colorLook="quick"
          />
          <ProductSpecs product={detail} recommendedSize={recommendedSize} />
          <Link to={detailHref} className="shop-link inline-block text-sm">
            상품 상세 보기
          </Link>
        </div>
        <QuickAddActions
          option={options.selected}
          missingPick={options.missingPick}
          quantity={quantity}
          onQuantityChange={setQuantity}
          childId={childId}
          isSelling={isOnSale(detail)}
          viewer={isChild ? 'child' : user ? 'member' : 'guest'}
          loginHref={loginHref}
          onClose={onClose}
        />
      </div>
    </div>
  )
}
