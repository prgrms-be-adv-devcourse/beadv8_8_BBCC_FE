import {
  categoryTree,
  useCatalogCategoriesQuery,
  useMeasurementItemsQuery,
  useProductTypesQuery,
} from '@/entities/catalog'
import { CreateCategoryForm } from '@/features/manage-catalog'
import { getErrorMessage } from '@/shared/api'
import { Badge } from '@/shared/ui/badge'
import { Card, CardTitle } from '@/shared/ui/card'
import { StateMessage } from '@/shared/ui/StateMessage'

/** 카테고리: 만들기 폼 + 트리 목록. 상품 유형 · 실측 항목은 앞 탭의 목록에서 고른다 */
export function CategoriesSection() {
  const categories = useCatalogCategoriesQuery()
  const productTypes = useProductTypesQuery()
  const items = useMeasurementItemsQuery()
  const failed = [categories, productTypes, items].find((query) => query.isError)

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <CardTitle>카테고리 만들기</CardTitle>
        {failed && <StateMessage tone="error">{getErrorMessage(failed.error)}</StateMessage>}
        {categories.data && productTypes.data && items.data && (
          <CreateCategoryForm
            categories={categories.data}
            productTypes={productTypes.data}
            measurementItems={items.data}
          />
        )}
      </Card>
      {categories.isPending && <StateMessage>불러오는 중…</StateMessage>}
      {categories.data?.length === 0 && <StateMessage>카테고리가 없어요.</StateMessage>}
      {categories.data && categories.data.length > 0 && (
        <Card className="divide-y p-0 text-sm">
          {categoryTree(categories.data).map(({ category, depth }) => (
            <div
              key={category.id}
              className="flex flex-wrap items-center gap-2 py-2 pr-4"
              style={{ paddingLeft: `${1 + depth * 1.5}rem` }}
            >
              <span className="font-medium">
                {depth > 0 && '└ '}
                {category.name}
              </span>
              <Badge variant={category.isLeaf ? 'default' : 'muted'}>
                {category.isLeaf ? '말단' : '중간'}
              </Badge>
              {category.productTypeName && (
                <span className="text-muted-foreground">유형 {category.productTypeName}</span>
              )}
              {category.measurementItems.length > 0 && (
                <span className="text-muted-foreground ml-auto">
                  실측 {category.measurementItems.map((item) => item.name).join(' · ')}
                </span>
              )}
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}
