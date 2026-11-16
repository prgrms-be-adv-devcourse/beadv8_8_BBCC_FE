import {
  growthSourceLinesOf,
  growthSpeedTextOf,
  wearablePeriodTextOf,
} from '../model/growth-speed.rules'
import type { SizeRecommendation } from '../model/recommendation'
import { InfoTip } from './InfoTip'

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
  // 「… 예상해요 · 아직 성장 기록이 없어요」: 가운뎃점 뒤 마디는 중간에서 끊기지 않고 통째로 다음 줄로 넘어간다
  const [speedText, ...speedNotes] = growthSpeedTextOf(growthSpeed).split(' · ')
  return (
    <div className="text-ink-2 space-y-0.5 text-[13px]">
      {periodText && <p>{periodText}</p>}
      <p>
        {speedText}{' '}
        {speedNotes.map((note) => (
          <span key={note} className="inline-block">
            · {note}
          </span>
        ))}{' '}
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
