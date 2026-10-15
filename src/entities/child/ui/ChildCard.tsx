import { Badge } from '@/shared/ui/badge'
import { Card } from '@/shared/ui/card'
import { BODY_TYPE_LABEL, GENDER_LABEL, PREFERRED_FIT_LABEL, type Child } from '../model/child'

type ChildCardProps = { child: Child }

export function ChildCard({ child }: ChildCardProps) {
  return (
    <Card className="flex items-center justify-between">
      <div>
        <p className="font-medium">
          {child.name} <span className="text-muted-foreground text-sm">#{child.id}</span>
        </p>
        <p className="text-muted-foreground text-sm">
          {child.birthDate} · {GENDER_LABEL[child.gender]} · {child.heightCm}cm · {child.weightKg}kg
        </p>
      </div>
      <div className="flex gap-1">
        {child.bodyType && <Badge variant="growth">체형 {BODY_TYPE_LABEL[child.bodyType]}</Badge>}
        {child.preferredFit && (
          <Badge variant="growth">핏 {PREFERRED_FIT_LABEL[child.preferredFit]}</Badge>
        )}
        <Badge variant="muted">성장 기록 {child.growthRecordCount}건</Badge>
      </div>
    </Card>
  )
}
