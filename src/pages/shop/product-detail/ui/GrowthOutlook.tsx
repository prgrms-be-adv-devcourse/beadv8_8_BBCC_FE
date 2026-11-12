import {
  growthSourceLinesOf,
  growthSpeedTextOf,
  wearablePeriodTextOf,
  type SizeRecommendation,
} from '@/entities/recommendation'
import { InfoTip } from '@/shared/ui/InfoTip'

type GrowthOutlookProps = {
  recommendation: Pick<SizeRecommendation, 'recommendedSize' | 'wearablePeriods' | 'growthSpeed'>
}

/**
 * 추천 사이즈의 예상치 두 줄: 「약 6개월 더 입을 수 있을 것으로 예상해요」(기간) ·
 * 「… 한 달에 약 0.6cm씩 클 것으로 예상해요」(성장 속도) + ⓘ(출처 · 실제와 다를 수 있다는 안내)
 */
export function GrowthOutlook({ recommendation }: GrowthOutlookProps) {
  const periodText = wearablePeriodTextOf(recommendation)
  const { growthSpeed } = recommendation
  return (
    <div className="text-ink-2 space-y-0.5 text-[13px]">
      {periodText && <p>{periodText}</p>}
      <p>
        {growthSpeedTextOf(growthSpeed)}{' '}
        <InfoTip label="성장 속도 안내">
          {growthSourceLinesOf(growthSpeed).map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </InfoTip>
      </p>
    </div>
  )
}
