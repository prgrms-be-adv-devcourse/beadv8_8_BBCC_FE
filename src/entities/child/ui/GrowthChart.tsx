import type { GrowthRecord } from '../model/child'
import { forecastGrowth, sizeBandOf } from '../model/growth-forecast'

type GrowthChartProps = {
  records: GrowthRecord[]
  /** 지금 키 (자녀 정보). 기록이 없을 때도 구간을 보여 준다 */
  currentHeightCm: number
}

const W = 320
const H = 170
const PAD = { left: 34, right: 12, top: 10, bottom: 22 }

/** 키 기록 선 그래프 + 아동복 사이즈 구간 띠 + 다음 사이즈 예고(추정) */
export function GrowthChart({ records, currentHeightCm }: GrowthChartProps) {
  const sorted = [...records].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt))
  const forecast = forecastGrowth(sorted, currentHeightCm)
  const heights = [currentHeightCm, ...sorted.map((record) => record.heightCm)]
  const low = sizeBandOf(Math.min(...heights)).minCm
  const high = sizeBandOf(Math.max(...heights)).maxCm + (forecast.monthsToNext !== null ? 10 : 0)
  const times = sorted.map((record) => Date.parse(record.recordedAt))
  const start = times[0] ?? 0
  const lastTime = times.at(-1) ?? start
  const forecastEnd =
    forecast.monthsToNext !== null
      ? lastTime + forecast.monthsToNext * 30.44 * 86_400_000
      : lastTime
  const end = Math.max(forecastEnd, start + 86_400_000)
  const x = (time: number) =>
    PAD.left + ((time - start) / (end - start)) * (W - PAD.left - PAD.right)
  const y = (cm: number) => PAD.top + ((high - cm) / (high - low)) * (H - PAD.top - PAD.bottom)
  const bands: number[] = []
  for (let size = low + 5; size < high; size += 10) bands.push(size)
  const lastPoint = sorted.at(-1)

  return (
    <figure className="space-y-2">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`키 기록 ${sorted.length}개, 지금 ${currentHeightCm}cm는 ${forecast.band.size} 사이즈 구간`}
        className="w-full"
      >
        {bands.map((size, index) => (
          <g key={size}>
            <rect
              x={PAD.left}
              y={y(size + 5)}
              width={W - PAD.left - PAD.right}
              height={y(size - 5) - y(size + 5)}
              className={
                size === forecast.band.size
                  ? 'fill-primary/15'
                  : index % 2 === 0
                    ? 'fill-muted/60'
                    : 'fill-transparent'
              }
            />
            <text
              x={PAD.left - 4}
              y={y(size) + 3}
              textAnchor="end"
              className="fill-muted-foreground text-[9px]"
            >
              {size}
            </text>
          </g>
        ))}
        {sorted.length > 1 && (
          <polyline
            points={sorted.map((record, i) => `${x(times[i])},${y(record.heightCm)}`).join(' ')}
            className="stroke-primary fill-none"
            strokeWidth={2}
          />
        )}
        {lastPoint && forecast.monthsToNext !== null && (
          <line
            x1={x(lastTime)}
            y1={y(lastPoint.heightCm)}
            x2={x(forecastEnd)}
            y2={y(forecast.band.maxCm)}
            className="stroke-primary"
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
        )}
        {sorted.map((record, i) => (
          <circle
            key={record.id}
            cx={x(times[i])}
            cy={y(record.heightCm)}
            r={3}
            className="fill-primary"
          />
        ))}
        <text x={PAD.left} y={H - 6} className="fill-muted-foreground text-[9px]">
          {sorted[0]?.recordedAt.slice(0, 10) ?? ''}
        </text>
        <text
          x={W - PAD.right}
          y={H - 6}
          textAnchor="end"
          className="fill-muted-foreground text-[9px]"
        >
          {forecast.monthsToNext !== null ? '예상' : (lastPoint?.recordedAt.slice(0, 10) ?? '')}
        </text>
      </svg>
      <figcaption className="space-y-0.5 text-sm">
        <p>
          지금 키 {currentHeightCm}cm는{' '}
          <strong>
            {forecast.band.size} 사이즈 구간({forecast.band.minCm}~{forecast.band.maxCm}cm)
          </strong>
          이에요.
        </p>
        {forecast.cmPerMonth !== null ? (
          <p>
            최근 기록으로 보면 한 달에 약 {forecast.cmPerMonth}cm씩 자라고 있어요.{' '}
            {forecast.monthsToNext !== null ? (
              <>
                약 <strong>{forecast.monthsToNext}개월 뒤</strong> {forecast.band.size + 10}{' '}
                사이즈로 넘어갈 수 있어요.
              </>
            ) : (
              '다음 사이즈까지는 한참 남았어요.'
            )}
          </p>
        ) : (
          <p className="text-muted-foreground">
            한 달 이상 떨어진 키 기록이 2개 넘게 쌓이면 다음 사이즈 시기를 알려 드려요.
          </p>
        )}
        <p className="text-muted-foreground text-xs">
          아이 기록으로 낸 추정이에요. 사이즈 구간은 아동복 일반 표기(호칭 = 키) 기준이고 브랜드마다
          다를 수 있어요.
        </p>
      </figcaption>
    </figure>
  )
}
