import { Badge } from '@/shared/ui/badge'
import { FIT_LABEL, type Fit } from '../model/recommendation'

export function FitBadge({ size, fit }: { size?: string; fit: Fit }) {
  return (
    <Badge variant="growth">
      {size && `추천 ${size} · `}
      {FIT_LABEL[fit]}
    </Badge>
  )
}
