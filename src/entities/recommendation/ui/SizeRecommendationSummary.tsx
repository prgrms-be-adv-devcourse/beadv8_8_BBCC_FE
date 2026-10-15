import { Badge } from '@/shared/ui/badge'
import type { SizeRange, SizeRecommendation } from '../model/recommendation'
import { FitBadge } from './FitBadge'
import { SizeFitChart } from './SizeFitChart'

type SizeRecommendationSummaryProps = {
  recommendation: SizeRecommendation
  /** 고른 자녀 (있으면 사이즈별 권장 키 위에 자녀 키를 그린다) */
  child?: { name: string; heightCm: number } | null
  /** 상품 상세의 사이즈별 권장 키 (그래프용, 추천 응답에는 없다) */
  sizes: SizeRange[]
}

export function SizeRecommendationSummary({
  recommendation,
  child,
  sizes,
}: SizeRecommendationSummaryProps) {
  const { recommendedSize, fit, notices, candidateSizes } = recommendation
  return (
    <div className="space-y-1">
      {recommendedSize ? (
        <p>
          추천 사이즈 <Badge variant="highlight">{recommendedSize}</Badge>{' '}
          {fit && <FitBadge fit={fit} />}
          {candidateSizes.length > 1 && (
            <span className="text-muted-foreground ml-1 text-xs">
              후보 {candidateSizes.join(' · ')} 중
            </span>
          )}
        </p>
      ) : (
        // 사이즈 무관 · 맞는 사이즈 없음: 백엔드 안내 문구가 곧 결과
        <p>{notices[0]?.message ?? '맞는 사이즈가 없어요.'}</p>
      )}
      {child && (
        <SizeFitChart
          sizes={sizes}
          recommendedSize={recommendedSize}
          fit={fit}
          candidateSizes={candidateSizes}
          child={child}
        />
      )}
      {recommendedSize && notices.length > 0 && (
        <ul className="text-muted-foreground list-disc pl-5 text-xs">
          {notices.map((notice) => (
            <li key={notice.code}>{notice.message}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
