import { useEffect, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router'
import { useCategoriesQuery, useProductQuery } from '@/entities/product'
import {
  GARMENT_PART_SPEC,
  GARMENT_PARTS,
  categoriesForPart,
  partsForPurchase,
  toReferenceGarmentFormFromPurchase,
  toReferenceGarmentFromPurchase,
  usePurchasedGarmentsInfiniteQuery,
  useReferenceGarmentsQuery,
  type GarmentPart,
  type ReferenceGarmentForm,
} from '@/entities/recommendation'
import { ReferenceGarmentEditor } from '@/features/manage-reference-garment'
import { getErrorMessage } from '@/shared/api'
import { GARMENT_FROM, REFERENCE_GARMENTS } from '@/shared/config'
import { StateMessage } from '@/shared/ui/StateMessage'
import { PurchasedGarmentPicker } from './PurchasedGarmentPicker'

type ReferenceGarmentSectionProps = { childId: string }

/** 「산 옷에서 고르기」로 고른 옷: 채울 칸 · 폼 · 안내 글 */
type PickedGarment = { key: string; part: GarmentPart; form: ReferenceGarmentForm; notice: string }

/**
 * 자녀 프로필의 기준 옷 칸: 상의 · 바지 · 아우터 · 원피스 · 치마 다섯 칸. 「산 옷에서 고르기」로 구매확정한 옷을 고르거나,
 * 주문 상세 「기준 옷으로」에서 오면(주소에 상품 · 사이즈) 그 옷의 카테고리와 산 사이즈 실측으로 맞는 칸을 채운다.
 * 저장하면 고른 옷과 주소의 상품 · 사이즈를 지운다
 */
export function ReferenceGarmentSection({ childId }: ReferenceGarmentSectionProps) {
  const garments = useReferenceGarmentsQuery(childId)
  const categories = useCategoriesQuery()
  const [params, setParams] = useSearchParams()
  const { hash } = useLocation()
  const productId = params.get(GARMENT_FROM.product) ?? ''
  const size = params.get(GARMENT_FROM.size) ?? ''
  const product = useProductQuery(productId, Boolean(productId && size))
  const categoryPath = categories.data?.find((c) => c.id === product.data?.categoryId)?.path
  const purchase =
    product.data && categoryPath !== undefined
      ? toReferenceGarmentFromPurchase(
          { categoryId: product.data.categoryId, categoryPath, sizeSpecs: product.data.sizeSpecs },
          size,
        )
      : null
  const purchases = usePurchasedGarmentsInfiniteQuery(childId)
  const [picked, setPicked] = useState<PickedGarment | null>(null)
  const isReady = Boolean(garments.data && categories.data)
  const pathOf = (categoryId: string | null) =>
    categories.data?.find((c) => c.id === categoryId)?.path ?? null
  const purchaseRows = (purchases.data?.garments ?? []).map((garment) => ({
    orderItemId: garment.orderItemId,
    name: garment.productName ?? '상품 정보 없음',
    size: garment.size,
    confirmedAt: garment.confirmedAt,
    parts: partsForPurchase(pathOf(garment.categoryId)),
  }))

  const handlePick = (orderItemId: string, part: GarmentPart) => {
    const garment = purchases.data?.garments.find((item) => item.orderItemId === orderItemId)
    if (!garment) return
    const name = garment.productName ?? '고른 옷'
    setPicked({
      key: `${orderItemId}-${part}`,
      part,
      form: toReferenceGarmentFormFromPurchase(part, {
        categoryId: garment.categoryId,
        categoryPath: pathOf(garment.categoryId),
        measurements: garment.measurements,
      }),
      notice: `「${name}」 ${garment.size} 사이즈로 ${GARMENT_PART_SPEC[part].label} 칸을 채웠어요. 비어 있는 칸을 채우고 저장해 주세요.`,
    })
    document.getElementById(REFERENCE_GARMENTS)?.scrollIntoView({ block: 'start' })
  }

  // 맞춤 목록 · 주문 상세에서 #reference-garments로 오면 이 칸으로 내린다
  useEffect(() => {
    if (hash === `#${REFERENCE_GARMENTS}` && isReady)
      document.getElementById(REFERENCE_GARMENTS)?.scrollIntoView({ block: 'start' })
  }, [hash, isReady, purchase?.part])

  // 고른 산 옷이 주소로 온 옷보다 먼저다
  const initialFormOf = (part: GarmentPart) => {
    if (picked) return picked.part === part ? picked.form : undefined
    return purchase?.part === part ? purchase.form : undefined
  }

  const clearPurchase = () => {
    setPicked(null)
    if (productId) setParams({}, { replace: true })
  }

  return (
    <section
      id={REFERENCE_GARMENTS}
      aria-labelledby="reference-garments-title"
      className="border-rule scroll-mt-32 space-y-4 rounded-lg border p-4 md:p-5"
    >
      <h2 id="reference-garments-title" className="text-section">
        기준 옷
      </h2>
      <p className="text-ink-3 text-[13px]">
        종류마다 잘 맞게 입는 옷의 실측을 적어 두면, 사이즈 추천이 같은 종류의 옷과 비교해요.
      </p>
      {picked && <StateMessage>{picked.notice}</StateMessage>}
      {!picked && purchase && product.data && (
        <StateMessage>
          {`「${product.data.name}」 ${size} 사이즈 실측으로 ${GARMENT_PART_SPEC[purchase.part].label} 칸을 채웠어요. 확인하고 저장해 주세요.`}
        </StateMessage>
      )}
      {product.data && categoryPath !== undefined && !purchase && (
        <StateMessage tone="error">
          이 옷은 기준 옷으로 쓸 수 없어요. 상의 · 바지 · 아우터 · 원피스 · 치마이고, 산 사이즈의
          실측이 있는 옷만 쓸 수 있어요.
        </StateMessage>
      )}
      {product.isError && (
        <StateMessage tone="error">{getErrorMessage(product.error)}</StateMessage>
      )}
      {(garments.isPending || categories.isPending) && <StateMessage>불러오는 중…</StateMessage>}
      {garments.isError && (
        <StateMessage tone="error">{getErrorMessage(garments.error)}</StateMessage>
      )}
      {categories.isError && (
        <StateMessage tone="error">{getErrorMessage(categories.error)}</StateMessage>
      )}
      {garments.data && categories.data && (
        <div className="grid gap-4 md:grid-cols-2">
          {GARMENT_PARTS.map((part) => {
            const garment = garments.data.find((item) => item.part === part) ?? null
            const initialForm = initialFormOf(part)
            const source = picked?.part === part ? picked.key : initialForm ? 'purchase' : 'saved'
            return (
              <ReferenceGarmentEditor
                key={`${part}-${JSON.stringify(garment)}-${source}`}
                childId={childId}
                part={part}
                garment={garment}
                categories={categoriesForPart(part, categories.data)}
                initialForm={initialForm}
                onSaved={initialForm ? clearPurchase : undefined}
              />
            )
          })}
        </div>
      )}
      {purchases.isError && (
        <StateMessage tone="error">{getErrorMessage(purchases.error)}</StateMessage>
      )}
      {purchases.data && categories.data && (
        <PurchasedGarmentPicker
          rows={purchaseRows}
          hasMore={purchases.hasNextPage}
          isLoadingMore={purchases.isFetchingNextPage}
          onMore={() => purchases.fetchNextPage()}
          onPick={handlePick}
        />
      )}
    </section>
  )
}
