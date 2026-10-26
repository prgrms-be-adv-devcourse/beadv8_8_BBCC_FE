import { Link, useNavigate } from 'react-router'
import { useAttributesQuery } from '@/entities/catalog'
import { CreateProductTypeForm } from '@/features/manage-catalog'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { ListSkeleton } from '@/shared/ui/Skeleton'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StateMessage } from '@/shared/ui/StateMessage'

/** 만들기 전에 알아 둘 것 */
const GUIDE = [
  {
    title: '연결할 항목 고르기',
    body: '넣은 순서가 판매자의 상품 등록 화면 순서예요.',
  },
  {
    title: '옵션과 정보',
    body: '옵션은 재고 · 가격을 나누는 단위(색상 · 사이즈)이고, 정보는 상품 상세에 보여 줘요. 옵션은 값을 하나 고르는 색 팔레트 · 목록 항목만 될 수 있어요.',
  },
  {
    title: '꼭 지킬 것',
    body: '필수 옵션이 하나 이상 있어야 하고, 사이즈 역할은 옵션 하나에만 둘 수 있어요.',
  },
]

/** 상품 유형 만들기 (목록과 따로): 왼쪽 알아 둘 것, 오른쪽 폼. 항목은 실제 항목 목록에서 고른다. 만들면 목록으로 */
export function AdminCatalogProductTypeNewPage() {
  const navigate = useNavigate()
  const attributes = useAttributesQuery()

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
        <div className="space-y-8 lg:sticky lg:top-28 lg:self-start">
          <PageHeader
            title="상품 유형 만들기"
            description="상품 등록 화면에 나올 항목과 그 역할을 정해요."
            note="POST /admin/product-types. 유형 규칙에 어긋나면 400, 이름이 겹치면 409"
          />
          <ol className="border-rule space-y-5 border-t pt-6">
            {GUIDE.map((item, index) => (
              <li key={item.title} className="flex gap-3.5">
                <span
                  aria-hidden
                  className="border-signal text-signal figure flex size-7 shrink-0 items-center justify-center rounded-full border text-[13px] font-bold"
                >
                  {index + 1}
                </span>
                <div className="space-y-0.5 pt-0.5">
                  <p className="text-sm font-bold">{item.title}</p>
                  <p className="text-ink-3 text-[13px]">{item.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="border-rule rounded-xl border p-5 md:p-8">
          {attributes.isPending && <ListSkeleton rows={2} />}
          {attributes.isError && (
            <StateMessage tone="error">{getErrorMessage(attributes.error)}</StateMessage>
          )}
          {attributes.data && (
            <CreateProductTypeForm
              attributes={attributes.data}
              onCreated={() => navigate(paths.admin.productTypes, { replace: true })}
            />
          )}
        </div>
      </div>
    </div>
  )
}
