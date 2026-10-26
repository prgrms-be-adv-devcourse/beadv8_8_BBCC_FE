import type { GrowthRecord } from '../model/child'
import { forecastGrowth, sizeBandOf } from '../model/growth-forecast'

type GrowthChartProps = {
  records: GrowthRecord[]
  /** 지금 키 (자녀 정보). 기록이 없을 때도 구간을 보여 준다 */
  currentHeightCm: number
}

const W = 560
const H = 230
const PAD = { left: 40, right: 64, top: 18, bottom: 28 }

/** 키 기록 선 그래프 + 아동복 사이즈 구간 띠 + 다음 사이즈 예고(추정) */
export function GrowthChart({ records, currentHeightCm }: GrowthChartProps) {
  const sorted = [...records].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt))
  const forecast = forecastGrowth(sorted, currentHeightCm)
  const heights = [currentHeightCm, ...sorted.map((record) => record.heightCm)]
  // 위아래로 한 구간씩 더 보여 지금 구간이 어디쯤인지 보이게 한다
  const low = sizeBandOf(Math.min(...heights)).minCm - 10
  const high = sizeBandOf(Math.max(...heights)).maxCm + 10
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
    <figure className="space-y-4">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`키 기록 ${sorted.length}개, 지금 ${currentHeightCm}cm는 ${forecast.band.size} 사이즈 구간`}
        className="h-auto w-full"
      >
        {/* 사이즈 구간 띠: 지금 구간은 코랄, 나머지는 한 줄 걸러 옅은 회색 */}
        {bands.map((size, index) => {
          const isCurrent = size === forecast.band.size
          return (
            <g key={size}>
              <rect
                x={PAD.left}
                y={y(size + 5)}
                width={W - PAD.left - PAD.right}
                height={y(size - 5) - y(size + 5)}
                className={
                  isCurrent
                    ? 'fill-fit-soft'
                    : index % 2 === 0
                      ? 'fill-muted/70'
                      : 'fill-transparent'
                }
              />
              <text
                x={PAD.left - 8}
                y={y(size) + 4}
                textAnchor="end"
                className={
                  isCurrent
                    ? 'fill-fit-ink text-[11px] font-bold'
                    : 'fill-muted-foreground text-[11px]'
                }
              >
                {size}
              </text>
            </g>
          )
        })}
        {lastPoint && forecast.monthsToNext !== null && (
          <line
            x1={x(lastTime)}
            y1={y(lastPoint.heightCm)}
            x2={x(forecastEnd)}
            y2={y(forecast.band.maxCm)}
            className="stroke-primary opacity-45"
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray="2 5"
          />
        )}
        {sorted.length > 1 && (
          <polyline
            points={sorted.map((record, i) => `${x(times[i])},${y(record.heightCm)}`).join(' ')}
            className="stroke-primary fill-none"
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
        {sorted.map((record, i) =>
          record === lastPoint ? null : (
            <circle
              key={record.id}
              cx={x(times[i])}
              cy={y(record.heightCm)}
              r={3.5}
              strokeWidth={2}
              className="stroke-primary fill-card"
            />
          ),
        )}
        {lastPoint && (
          <g>
            <circle
              cx={x(lastTime)}
              cy={y(lastPoint.heightCm)}
              r={6}
              strokeWidth={2.5}
              className="fill-primary stroke-card"
            />
            <text
              x={x(lastTime) + 10}
              y={y(lastPoint.heightCm) - 8}
              className="fill-primary text-[12px] font-bold"
            >
              {lastPoint.heightCm}cm
            </text>
          </g>
        )}
        <text x={PAD.left} y={H - 8} className="fill-muted-foreground text-[11px]">
          {sorted[0]?.recordedAt.slice(0, 10).replaceAll('-', '.') ?? ''}
        </text>
        <text
          x={W - PAD.right}
          y={H - 8}
          textAnchor="end"
          className="fill-muted-foreground text-[11px]"
        >
          {forecast.monthsToNext !== null
            ? `${forecast.band.size + 10} 사이즈 예상`
            : (lastPoint?.recordedAt.slice(0, 10).replaceAll('-', '.') ?? '')}
        </text>
      </svg>
      <figcaption className="space-y-3">
        {/* 숫자 세 칸: 지금 사이즈 · 자라는 속도 · 다음 사이즈 */}
        <dl className="border-rule divide-rule grid grid-cols-3 divide-x border-y py-3">
          <div className="space-y-0.5 pr-3">
            <dt className="text-muted-foreground text-xs">지금 사이즈</dt>
            <dd className="text-fit-ink figure text-lg font-bold">{forecast.band.size}</dd>
            <dd className="text-muted-foreground figure text-xs">
              {forecast.band.minCm}~{forecast.band.maxCm}cm
            </dd>
          </div>
          <div className="space-y-0.5 px-3">
            <dt className="text-muted-foreground text-xs">자라는 속도</dt>
            <dd className="figure text-lg font-bold">
              {forecast.cmPerMonth !== null ? (
                <>
                  {forecast.cmPerMonth}
                  <span className="ml-0.5 text-[13px] font-medium">cm/월</span>
                </>
              ) : (
                '—'
              )}
            </dd>
          </div>
          <div className="space-y-0.5 pl-3">
            <dt className="text-muted-foreground text-xs">다음 사이즈</dt>
            <dd className="figure text-lg font-bold">
              {forecast.monthsToNext !== null ? (
                <>
                  약 {forecast.monthsToNext}
                  <span className="ml-0.5 text-[13px] font-medium">개월 뒤</span>
                </>
              ) : forecast.cmPerMonth !== null ? (
                <span className="text-[15px]">한참 남았어요</span>
              ) : (
                '—'
              )}
            </dd>
          </div>
        </dl>
        {forecast.cmPerMonth === null && (
          <p className="text-sm">
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
