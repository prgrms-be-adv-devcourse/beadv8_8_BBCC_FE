import { Link, useNavigate, useParams } from 'react-router'
import {
  canChangeCategory,
  categoryPath,
  useCatalogCategoriesQuery,
  useMeasurementItemsQuery,
  useProductTypesQuery,
} from '@/entities/catalog'
import { EditCategoryForm } from '@/features/manage-catalog'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { ListSkeleton } from '@/shared/ui/Skeleton'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StateMessage } from '@/shared/ui/StateMessage'

/** 상품이 이미 있는 카테고리에서 되는 변경 (그 밖은 저장할 때 거절된다) */
const ALLOWED_WITH_PRODUCTS = ['필수 실측 항목 빼기', '필수 실측 항목 순서 바꾸기']

/** 카테고리 수정: 왼쪽 제약 안내, 오른쪽 유형 · 실측 항목 폼. 카테고리 하나 API가 없어 목록에서 찾는다. 저장하면 목록으로 */
export function AdminCatalogCategoryEditPage() {
  const { categoryId = '' } = useParams()
  const navigate = useNavigate()
  const categories = useCatalogCategoriesQuery()
  const productTypes = useProductTypesQuery()
  const items = useMeasurementItemsQuery()
  const queries = [categories, productTypes, items]
  const failed = queries.find((query) => query.isError)
  const category = categories.data?.find((item) => item.id === categoryId)

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
        <div className="space-y-6 lg:sticky lg:top-28 lg:self-start">
          <PageHeader
            title={category ? `${category.name} 수정` : '카테고리 수정'}
            description="말단 카테고리의 상품 유형과 필수 실측 항목을 바꿔요. 이름과 위치는 바꿀 수 없어요."
            note="PUT /admin/categories/{id}로 유형과 실측 항목 전체를 보낸다(순서가 실측 순서). 중간 카테고리면 400, 상품이 있는 카테고리에서 허용되지 않는 변경이면 409"
          />
          <section className="border-rule space-y-3 border-t pt-6">
            <h2 className="text-sm font-bold">상품이 있는 카테고리는 다음 변경만 돼요</h2>
            <ul className="text-ink-2 list-disc space-y-1 pl-5 text-[13px]">
              {ALLOWED_WITH_PRODUCTS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="text-ink-3 text-[13px]">
              상품 유형을 바꾸거나 필수 실측 항목을 더하면 저장할 때 거절돼요.
            </p>
          </section>
        </div>
        <div className="border-rule rounded-xl border p-5 md:p-8">
          {failed && <StateMessage tone="error">{getErrorMessage(failed.error)}</StateMessage>}
          {!failed && queries.some((query) => query.isPending) && <ListSkeleton rows={2} />}
          {categories.data && !category && <StateMessage>없는 카테고리예요.</StateMessage>}
          {category && !canChangeCategory(category) && (
            <StateMessage>중간 카테고리는 수정할 수 없어요.</StateMessage>
          )}
          {category && canChangeCategory(category) && productTypes.data && items.data && (
            <EditCategoryForm
              category={category}
              path={categoryPath(category, categories.data ?? [])}
              productTypes={productTypes.data}
              measurementItems={items.data}
              onSaved={() => navigate(paths.admin.categories, { replace: true })}
            />
          )}
        </div>
      </div>
    </div>
  )
}
