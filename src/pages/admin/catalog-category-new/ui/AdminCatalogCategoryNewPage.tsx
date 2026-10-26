import { Link, useNavigate } from 'react-router'
import {
  useCatalogCategoriesQuery,
  useMeasurementItemsQuery,
  useProductTypesQuery,
} from '@/entities/catalog'
import { CreateCategoryForm } from '@/features/manage-catalog'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { ListSkeleton } from '@/shared/ui/Skeleton'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StateMessage } from '@/shared/ui/StateMessage'

/** 만들기 전에 알아 둘 것 */
const GUIDE = [
  {
    title: '위치',
    body: '부모를 고르지 않으면 맨 위 카테고리가 돼요. 말단 카테고리 아래에는 둘 수 없어요.',
  },
  {
    title: '중간과 말단',
    body: '중간 카테고리는 아래에 카테고리를 두고, 상품은 말단에만 등록해요.',
  },
  {
    title: '말단이면 유형과 실측 항목',
    body: '상품 유형을 꼭 골라요. 필수 실측 항목은 고른 순서가 실측표의 열 순서예요.',
  },
]

/** 카테고리 만들기 (목록과 따로): 왼쪽 알아 둘 것, 오른쪽 폼. 부모 · 유형 · 실측 항목은 실제 목록에서 고른다. 만들면 목록으로 */
export function AdminCatalogCategoryNewPage() {
  const navigate = useNavigate()
  const categories = useCatalogCategoriesQuery()
  const productTypes = useProductTypesQuery()
  const items = useMeasurementItemsQuery()
  const queries = [categories, productTypes, items]
  const failed = queries.find((query) => query.isError)

  return (
    <div className="shop-look space-y-6">
      <Link
        to={paths.admin.categories}
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
        카테고리
      </Link>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12">
        <div className="space-y-8 lg:sticky lg:top-28 lg:self-start">
          <PageHeader
            title="카테고리 만들기"
            description="판매자가 상품을 등록할 자리를 만들어요."
            note="POST /admin/categories. 말단 아래 · 중간에 실측 항목이면 400, 같은 위치 같은 이름이면 409"
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
          {failed && <StateMessage tone="error">{getErrorMessage(failed.error)}</StateMessage>}
          {!failed && queries.some((query) => query.isPending) && <ListSkeleton rows={2} />}
          {categories.data && productTypes.data && items.data && (
            <CreateCategoryForm
              categories={categories.data}
              productTypes={productTypes.data}
              measurementItems={items.data}
              onCreated={() => navigate(paths.admin.categories, { replace: true })}
            />
          )}
        </div>
      </div>
    </div>
  )
}
