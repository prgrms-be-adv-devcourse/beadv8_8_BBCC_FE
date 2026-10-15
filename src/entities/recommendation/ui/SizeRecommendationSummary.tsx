import { Badge } from '@/shared/ui/badge'
import type { SizeRecommendation } from '../model/recommendation'
import { FitBadge } from './FitBadge'
import { SizeFitChart } from './SizeFitChart'

type SizeRecommendationSummaryProps = {
  recommendation: SizeRecommendation
  /** 고른 자녀 (있으면 사이즈별 권장 키 위에 자녀 키를 그린다) */
  child?: { name: string; heightCm: number } | null
}

export function SizeRecommendationSummary({
  recommendation,
  child,
}: SizeRecommendationSummaryProps) {
  return (
    <div className="space-y-1">
      <p>
        {recommendation.recommendedSize ? (
          <>
            추천 사이즈 <Badge variant="highlight">{recommendation.recommendedSize}</Badge>{' '}
            {recommendation.fit && <FitBadge fit={recommendation.fit} />}
          </>
        ) : (
          '맞는 사이즈가 없어요.'
        )}
      </p>
      {child && (
        <SizeFitChart
          sizes={recommendation.sizes}
          recommendedSize={recommendation.recommendedSize}
          child={child}
        />
      )}
      <ul className="text-muted-foreground list-disc pl-5 text-xs">
        {recommendation.reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
    </div>
  )
}
