import { Link, useNavigate, useParams } from 'react-router'
import { useAttributesQuery, useProductTypesQuery } from '@/entities/catalog'
import { EditProductTypeForm } from '@/features/manage-catalog'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { ListSkeleton } from '@/shared/ui/Skeleton'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StateMessage } from '@/shared/ui/StateMessage'

/** 상품이 이미 있는 유형에서 되는 변경 (그 밖은 저장할 때 거절된다) */
const ALLOWED_WITH_PRODUCTS = [
  '허용 값 추가',
  '선택 정보 항목 추가',
  '필수를 선택으로 바꾸기',
  '모든 값 허용으로 넓히기',
  '정보 항목끼리 순서 바꾸기',
]

/** 상품 유형 수정: 왼쪽 제약 안내, 오른쪽 연결 편집 폼. 유형 하나 API가 없어 목록에서 찾는다. 저장하면 목록으로 */
export function AdminCatalogProductTypeEditPage() {
  const { productTypeId = '' } = useParams()
  const navigate = useNavigate()
  const types = useProductTypesQuery()
  const attributes = useAttributesQuery()
  const productType = types.data?.find((type) => type.id === productTypeId)
  const failed = [types, attributes].find((query) => query.isError)

  return (
    <div className="shop-look space-y-6">
      <Link
        to={paths.admin.productTypes}
        className="text-ink-3 hover:text-ink active:text-ink-2 inline-flex min-h-11 items-center gap-1 rounded-md text-[13px] font-semibold transition-colors lg:min-h-0"
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
        상품 유형
      </Link>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12">
        <div className="space-y-6 lg:sticky lg:top-28 lg:self-start">
          <PageHeader
            title={productType ? `${productType.name} 수정` : '상품 유형 수정'}
            description="연결한 항목의 설정과 순서를 바꾸거나 항목을 더해요. 유형 이름은 바꿀 수 없어요."
            note="PUT /admin/product-types/{id}로 연결 목록 전체를 보낸다(순서가 연결 순서). 유형 규칙에 어긋나면 400, 상품이 있는 유형에서 허용되지 않는 변경이면 409"
          />
          <section className="border-rule space-y-3 border-t pt-6">
            <h2 className="text-sm font-bold">상품이 있는 유형은 다음 변경만 돼요</h2>
            <ul className="text-ink-2 list-disc space-y-1 pl-5 text-[13px]">
              {ALLOWED_WITH_PRODUCTS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="text-ink-3 text-[13px]">
              역할 · 사이즈 역할 · 가격 구분을 바꾸거나, 필수 항목을 더하거나, 옵션 순서를 바꾸면
              저장할 때 거절돼요.
            </p>
          </section>
        </div>
        <div className="border-rule rounded-xl border p-5 md:p-8">
          {(types.isPending || attributes.isPending) && <ListSkeleton rows={2} />}
          {failed && <StateMessage tone="error">{getErrorMessage(failed.error)}</StateMessage>}
          {types.data && !productType && <StateMessage>없는 상품 유형이에요.</StateMessage>}
          {productType && attributes.data && (
            <EditProductTypeForm
              productType={productType}
              attributes={attributes.data}
              onSaved={() => navigate(paths.admin.productTypes, { replace: true })}
            />
          )}
        </div>
      </div>
    </div>
  )
}
