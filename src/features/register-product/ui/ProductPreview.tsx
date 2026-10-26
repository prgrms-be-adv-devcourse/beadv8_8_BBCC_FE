import {
  ProductImage,
  ProductSellerLine,
  productMeta,
  type RegisterPreview,
} from '@/entities/product'
import { useMySellerQuery } from '@/entities/seller'
import { formatWon } from '@/shared/lib'

type ProductPreviewProps = { preview: RegisterPreview }

/** 이름을 아직 안 넣었을 때 자리 */
const NAME_PLACEHOLDER = '상품명을 넣어 주세요'

/**
 * 등록 폼 맨 위 미리보기: 구매자 화면의 목록 칸과 상품 상세 첫 줄을 입력하는 대로 보여 준다.
 * 누를 수 없다 (아직 없는 상품). 상점 이름은 내 판매자 정보에서
 */
export function ProductPreview({ preview }: ProductPreviewProps) {
  const seller = useMySellerQuery()
  const businessName = seller.data?.businessName ?? null
  const name = preview.name ?? NAME_PLACEHOLDER
  const options = preview.options.filter((option) => option.values.length > 0)

  return (
    <section aria-label="구매자 화면 미리보기" className="space-y-3">
      <div className="space-y-1">
        <h2 className="text-section">미리보기</h2>
        <p className="text-ink-3 text-[13px]">
          구매자 화면에 이렇게 보여요. 입력하는 대로 바뀌어요.
        </p>
      </div>
      <div className="bg-paper-2 grid gap-6 rounded-lg p-5 sm:grid-cols-[9rem_minmax(0,1fr)] md:p-6">
        {/* 목록 칸 (쇼핑 ProductTile과 같은 모양) */}
        <div className="max-sm:w-36">
          <p className="text-ink-3 mb-2 text-[13px] font-semibold">목록</p>
          <div className="rounded-card bg-paper overflow-hidden">
            <ProductImage src={preview.imageUrl} alt={name} className="aspect-[3/4]" />
          </div>
          <div className="mt-2.5 space-y-0.5">
            {businessName && (
              <p className="text-ink truncate text-[13px] font-bold">{businessName}</p>
            )}
            <p
              className={
                preview.name
                  ? 'text-ink-2 line-clamp-2 text-[13px] leading-snug'
                  : 'text-ink-3 text-[13px] leading-snug'
              }
            >
              {name}
            </p>
            <p className="figure text-ink pt-1 text-base font-bold">
              {preview.minPrice === null ? '—' : formatWon(preview.minPrice)}
            </p>
          </div>
        </div>

        {/* 상품 상세 첫 줄 (쇼핑 상품 상세와 같은 순서: 상점 → 카테고리 → 이름 → 가격 → 옵션) */}
        <div className="min-w-0">
          <p className="text-ink-3 mb-2 text-[13px] font-semibold">상품 상세</p>
          <div className="bg-paper space-y-2 rounded-lg p-4">
            {businessName && (
              <div className="border-rule border-b pb-3">
                <ProductSellerLine businessName={businessName} />
              </div>
            )}
            <p className="text-ink-3 pt-1 text-[13px]">{productMeta(preview)}</p>
            <p
              className={
                preview.name
                  ? 'text-section text-ink font-bold'
                  : 'text-section text-ink-3 font-bold'
              }
            >
              {name}
            </p>
            <p className="figure text-xl font-bold">
              {preview.minPrice === null
                ? '판매가를 넣어 주세요'
                : `${formatWon(preview.minPrice)}~`}
            </p>
            {options.length > 0 && (
              <dl className="space-y-2 pt-2">
                {options.map((option) => (
                  <div key={option.name} className="space-y-1">
                    <dt className="text-[13px] font-semibold">{option.name}</dt>
                    <dd className="flex flex-wrap gap-1.5">
                      {option.values.map((value) => (
                        <span
                          key={value}
                          className="border-rule text-ink-2 inline-flex h-8 items-center rounded-md border px-2.5 text-[13px]"
                        >
                          {value}
                        </span>
                      ))}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
