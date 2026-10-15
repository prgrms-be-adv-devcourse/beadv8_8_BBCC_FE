import { Badge } from '@/shared/ui/badge'
import { FIT_LABEL, type Fit } from '../model/recommendation'

type FitBadgeProps = { size?: string | null; fit?: Fit | null }

/** "추천 120 · 적정". 적합도를 모르면 사이즈만, 사이즈 무관 상품이면 "사이즈 무관" */
export function FitBadge({ size, fit }: FitBadgeProps) {
  return (
    <Badge variant="growth">
      {size ? `추천 ${size}` : fit ? '' : '사이즈 무관'}
      {size && fit && ' · '}
      {fit && FIT_LABEL[fit]}
    </Badge>
  )
}
