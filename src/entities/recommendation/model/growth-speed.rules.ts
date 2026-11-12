import type { GrowthSpeed } from './growth-speed'
import type { SizeRecommendation } from './recommendation'

/** 소수 첫째 자리 (0.55 → 0.6, 3.0 → 3) */
const tenthsText = (value: number): string => String(Math.round(value * 10) / 10)

/**
 * 성장이 반올림으로 0.0cm가 됐는지. 또래 평균은 늘 0보다 커서, 아이 기록 비중이 거의 100이면서
 * 기록의 키가 그대로이거나 줄었을 때만 나온다 (입력 실수일 가능성이 크다)
 */
export const isGrowthStalled = ({ cmPerMonth }: Pick<GrowthSpeed, 'cmPerMonth'>): boolean =>
  Math.round(cmPerMonth * 10) === 0

/** 성장 속도 줄: 아이 기록 비중(0 / 1 ~ 99 / 100)에 따라 무엇으로 본 값인지 밝힌다 */
export function growthSpeedTextOf(speed: GrowthSpeed): string {
  if (isGrowthStalled(speed)) return '최근 기록으로는 키가 거의 그대로예요'
  const growth = `한 달에 약 ${tenthsText(speed.cmPerMonth)}cm씩 클 것으로 예상해요`
  if (speed.childSharePercent >= 100) return `우리 아이 기록으로 보면 ${growth}`
  if (speed.childSharePercent > 0) return `우리 아이 기록과 또래 평균으로 보면 ${growth}`
  const note =
    speed.recordCount === 0 ? '아직 성장 기록이 없어요' : '기록이 한 달 넘게 쌓이면 반영해요'
  return `또래 평균으로 보면 ${growth} · ${note}`
}

const MAX_MONTHS = 24

/**
 * 기간 줄: 추천 사이즈를 앞으로 입을 수 있는 개월 수 (24 상한, 0이면 곧 작아짐).
 * 추천 사이즈 · 기간이 없거나, 성장이 0.0cm로 반올림돼 성장 0으로 계산한 값이면 숨긴다 (null)
 */
export function wearablePeriodTextOf({
  recommendedSize,
  wearablePeriods,
  growthSpeed,
}: Pick<SizeRecommendation, 'recommendedSize' | 'wearablePeriods' | 'growthSpeed'>): string | null {
  if (!recommendedSize || isGrowthStalled(growthSpeed)) return null
  const months = wearablePeriods.find((period) => period.size === recommendedSize)?.months
  if (months == null) return null
  if (months <= 0) return '곧 작아질 것으로 예상해요'
  if (months >= MAX_MONTHS) return '2년 이상 입을 수 있을 것으로 예상해요'
  return `약 ${months}개월 더 입을 수 있을 것으로 예상해요`
}

const GROWTH_DISCLAIMER =
  '아이마다 크는 속도가 달라 실제와 다를 수 있어요. 한 달에 한 번 키를 기록하면 더 정확해져요.'

/**
 * 성장 속도 줄의 ⓘ 안내 창 내용: 또래 평균 출처(성장이 0.0cm면 또래 평균 값과 기록 확인 안내),
 * 아이 기록을 반영했으면 횟수 · 기간, 마지막에 실제와 다를 수 있다는 안내
 */
export function growthSourceLinesOf(speed: GrowthSpeed): string[] {
  const table = isGrowthStalled(speed)
    ? `또래 평균은 한 달에 약 ${tenthsText(speed.tableCmPerMonth)}cm예요. 키를 잰 날짜와 값이 맞는지 확인해 보세요.`
    : `또래 평균은 ${speed.tableSource} 자료로 계산했어요`
  const records =
    speed.childSharePercent > 0
      ? [
          `우리 아이 성장 기록 ${speed.recordCount}회(${tenthsText(speed.recordMonths)}개월)를 함께 반영했어요`,
        ]
      : []
  return [table, ...records, GROWTH_DISCLAIMER]
}
