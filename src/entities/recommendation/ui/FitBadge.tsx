import { Badge } from '@/shared/ui/badge'
import { FIT_LABEL, type Fit } from '../model/recommendation'

type FitBadgeProps = { size?: string; fit: Fit }

export function FitBadge({ size, fit }: FitBadgeProps) {
  return (
    <Badge variant="growth">
      {size && `추천 ${size} · `}
      {FIT_LABEL[fit]}
    </Badge>
  )
}
