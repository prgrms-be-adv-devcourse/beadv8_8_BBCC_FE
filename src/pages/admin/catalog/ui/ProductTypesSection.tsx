import {
  ATTRIBUTE_ROLE_LABEL,
  useAttributesQuery,
  useProductTypesQuery,
  type ProductTypeLink,
} from '@/entities/catalog'
import { CreateProductTypeForm } from '@/features/manage-catalog'
import { getErrorMessage } from '@/shared/api'
import { Badge } from '@/shared/ui/badge'
import { Card, CardTitle } from '@/shared/ui/card'
import { StateMessage } from '@/shared/ui/StateMessage'

/** 연결 하나의 설정을 한 줄 글로 (예: 옵션 · 필수 · 사이즈 역할 · 허용 값 2개) */
function linkSummary(link: ProductTypeLink): string {
  return [
    ATTRIBUTE_ROLE_LABEL[link.role],
    link.required ? '필수' : '선택',
    link.sizeRole && '사이즈 역할',
    link.priceAffecting && '가격 구분',
    link.inputType !== 'TEXT' &&
      (link.allValuesAllowed
        ? '모든 값 허용'
        : `허용 값 ${link.allowedValues.map((value) => value.name).join(', ')}`),
  ]
    .filter(Boolean)
    .join(' · ')
}

/** 상품 유형: 만들기 폼 + 목록. 항목은 항목 탭의 실제 목록에서 고른다 */
export function ProductTypesSection() {
  const types = useProductTypesQuery()
  const attributes = useAttributesQuery()

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <CardTitle>상품 유형 만들기</CardTitle>
        {attributes.isError && (
          <StateMessage tone="error">{getErrorMessage(attributes.error)}</StateMessage>
        )}
        {attributes.data && <CreateProductTypeForm attributes={attributes.data} />}
      </Card>
      {types.isPending && <StateMessage>불러오는 중…</StateMessage>}
      {types.isError && <StateMessage tone="error">{getErrorMessage(types.error)}</StateMessage>}
      {types.data?.length === 0 && <StateMessage>상품 유형이 없어요.</StateMessage>}
      {types.data?.map((type) => (
        <Card key={type.id} className="space-y-2 text-sm">
          <p className="font-medium">{type.name}</p>
          {type.links.map((link) => (
            <div key={link.attributeId} className="flex flex-wrap items-center gap-2">
              <Badge variant={link.role === 'OPTION' ? 'default' : 'muted'}>{link.name}</Badge>
              <span className="text-muted-foreground">{linkSummary(link)}</span>
            </div>
          ))}
        </Card>
      ))}
    </div>
  )
}
