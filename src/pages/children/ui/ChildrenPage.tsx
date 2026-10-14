import {
  BODY_TYPE_LABEL,
  GENDER_LABEL,
  PREFERRED_FIT_LABEL,
  useChildrenQuery,
} from '@/entities/child'
import { RegisterChildForm } from '@/features/register-child'
import { getErrorMessage } from '@/shared/api'
import { Badge } from '@/shared/ui/badge'
import { Card } from '@/shared/ui/card'
import { PageHeader, StateMessage } from '@/shared/ui/page-header'

export function ChildrenPage() {
  const children = useChildrenQuery()

  return (
    <div className="space-y-4">
      <PageHeader
        title="① 자녀 프로필"
        description="자녀를 등록하면 회원이 child.changed 이벤트를 보내고, 추천 · 주문이 각자 복사본을 저장해요."
      />
      <RegisterChildForm />
      <div className="space-y-2">
        <h2 className="font-semibold">내 자녀</h2>
        {children.isPending && <StateMessage>불러오는 중…</StateMessage>}
        {children.isError && (
          <StateMessage tone="error">{getErrorMessage(children.error)}</StateMessage>
        )}
        {children.data?.length === 0 && <StateMessage>등록한 자녀가 없어요.</StateMessage>}
        {children.data?.map((child) => (
          <Card key={child.id} className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                {child.name} <span className="text-muted-foreground text-sm">#{child.id}</span>
              </p>
              <p className="text-muted-foreground text-sm">
                {child.birthDate} · {GENDER_LABEL[child.gender]} · {child.heightCm}cm ·{' '}
                {child.weightKg}kg
              </p>
            </div>
            <div className="flex gap-1">
              {child.bodyType && (
                <Badge variant="growth">체형 {BODY_TYPE_LABEL[child.bodyType]}</Badge>
              )}
              {child.preferredFit && (
                <Badge variant="growth">핏 {PREFERRED_FIT_LABEL[child.preferredFit]}</Badge>
              )}
              <Badge variant="muted">성장 기록 {child.growthRecordCount}건</Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
