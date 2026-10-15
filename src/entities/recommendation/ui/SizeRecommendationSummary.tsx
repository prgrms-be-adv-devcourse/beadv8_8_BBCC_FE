import { Badge } from '@/shared/ui/badge'
import type { SizeRecommendation } from '../model/recommendation'
import { FitBadge } from './FitBadge'

type SizeRecommendationSummaryProps = {
  recommendation: SizeRecommendation
}

export function SizeRecommendationSummary({ recommendation }: SizeRecommendationSummaryProps) {
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
      <ul className="text-muted-foreground list-disc pl-5 text-xs">
        {recommendation.reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
    </div>
  )
}
