import { useState } from 'react'
import { cn } from '@/shared/lib'
import type { SizeSpec } from '../model/product'
import { BODY, garmentKindOf, wearFitOf } from '../model/wear-preview'

type WearPreviewProps = {
  specs: SizeSpec[]
  child: { name: string; heightCm: number }
  /** 처음 보여 줄 사이즈 (추천 사이즈) */
  initialSize?: string | null
}

const SCALE = 1.5 // 1cm = 1.5 단위
const W = 150

/** 아이 키에 맞춘 실루엣 위에 사이즈별 옷 길이를 겹쳐 그린다 (아동 평균 비율, 길이 비교용) */
export function WearPreview({ specs, child, initialSize }: WearPreviewProps) {
  const drawable = specs.filter((spec) => garmentKindOf(spec) !== null)
  const [picked, setPicked] = useState<string | null>(null)
  if (drawable.length === 0) return null
  const spec = drawable.find((item) => item.size === (picked ?? initialSize)) ?? drawable[0]
  const kind = garmentKindOf(spec)!
  const fit = wearFitOf(spec, child.heightCm)!
  const h = child.heightCm
  const viewH = h * SCALE + 12
  const yOf = (cm: number) => viewH - 6 - cm * SCALE
  const at = (ratio: number) => yOf(ratio * h)
  const cx = W / 2
  const shoulderHalf = h * 0.11 * SCALE
  const hipHalf = h * 0.09 * SCALE
  const wristDx = shoulderHalf + h * 0.05 * SCALE
  // 팔: 어깨 끝 → 손목 (살짝 벌린 채로 내림)
  const armLen = Math.hypot(
    wristDx - shoulderHalf,
    at(BODY.shoulder - BODY.arm) - at(BODY.shoulder),
  )
  const sleeveRatio = fit.sleeveCm ? Math.min(1.15, (fit.sleeveCm * SCALE) / armLen) : 0
  const sleeveEnd = (side: 1 | -1) => ({
    x: cx + side * (shoulderHalf + (wristDx - shoulderHalf) * sleeveRatio),
    y: at(BODY.shoulder) + (at(BODY.shoulder - BODY.arm) - at(BODY.shoulder)) * sleeveRatio,
  })

  return (
    <figure className="space-y-2">
      <div
        className="flex flex-wrap items-center gap-1 text-xs"
        role="group"
        aria-label="미리볼 사이즈"
      >
        <span className="text-muted-foreground mr-1">미리볼 사이즈</span>
        {drawable.map((item) => (
          <button
            key={item.size}
            type="button"
            aria-pressed={item.size === spec.size}
            onClick={() => setPicked(item.size)}
            className={cn(
              'rounded-full border px-2.5 py-0.5',
              item.size === spec.size
                ? 'border-primary bg-primary/10 text-primary font-semibold'
                : 'bg-white',
            )}
          >
            {item.size}
          </button>
        ))}
      </div>
      <div className="flex items-end gap-4">
        <svg
          viewBox={`0 0 ${W} ${viewH}`}
          role="img"
          aria-label={`${child.name} 키 ${h}cm에 ${spec.size} 사이즈: ${fit.hem}${fit.sleeve ? `, 소매는 ${fit.sleeve}` : ''}`}
          className="h-56 w-auto shrink-0"
        >
          {/* 몸 (평균 비율 실루엣) */}
          <g className="fill-muted stroke-muted-foreground/40" strokeWidth={1}>
            <circle cx={cx} cy={at(0.91)} r={h * 0.075 * SCALE} />
            <path
              d={`M ${cx - shoulderHalf} ${at(BODY.shoulder)} L ${cx + shoulderHalf} ${at(BODY.shoulder)} L ${cx + hipHalf} ${at(BODY.crotch)} L ${cx - hipHalf} ${at(BODY.crotch)} Z`}
            />
            <rect
              x={cx - hipHalf}
              y={at(BODY.crotch)}
              width={hipHalf * 0.9}
              height={at(0) - at(BODY.crotch)}
              rx={3}
            />
            <rect
              x={cx + hipHalf * 0.1}
              y={at(BODY.crotch)}
              width={hipHalf * 0.9}
              height={at(0) - at(BODY.crotch)}
              rx={3}
            />
          </g>
          {([-1, 1] as const).map((side) => (
            <line
              key={side}
              x1={cx + side * shoulderHalf}
              y1={at(BODY.shoulder)}
              x2={cx + side * wristDx}
              y2={at(BODY.shoulder - BODY.arm)}
              className="stroke-muted-foreground/40"
              strokeWidth={h * 0.045 * SCALE}
              strokeLinecap="round"
            />
          ))}
          {/* 옷 */}
          {kind === 'top' ? (
            <g className="fill-primary/45 stroke-primary" strokeWidth={1.2}>
              {fit.sleeveCm !== null &&
                ([-1, 1] as const).map((side) => (
                  <line
                    key={side}
                    x1={cx + side * shoulderHalf}
                    y1={at(BODY.shoulder)}
                    x2={sleeveEnd(side).x}
                    y2={sleeveEnd(side).y}
                    className="stroke-primary/70"
                    strokeWidth={h * 0.06 * SCALE}
                    strokeLinecap="butt"
                  />
                ))}
              <rect
                x={cx - shoulderHalf - 2}
                y={at(BODY.neck)}
                width={(shoulderHalf + 2) * 2}
                height={Math.max(4, yOf(fit.hemCm) - at(BODY.neck))}
                rx={4}
              />
            </g>
          ) : (
            <g className="fill-primary/45 stroke-primary" strokeWidth={1.2}>
              <rect
                x={cx - hipHalf - 2}
                y={at(BODY.waist)}
                width={(hipHalf + 2) * 2}
                height={Math.max(4, at(BODY.crotch) - at(BODY.waist))}
              />
              {([-1, 1] as const).map((side) => (
                <rect
                  key={side}
                  x={side < 0 ? cx - hipHalf - 2 : cx + 1}
                  y={at(BODY.crotch)}
                  width={hipHalf + 1}
                  height={Math.max(2, yOf(Math.max(fit.hemCm, 0)) - at(BODY.crotch))}
                />
              ))}
            </g>
          )}
          {/* 밑단 위치 */}
          <line
            x1={4}
            x2={W - 4}
            y1={yOf(Math.max(fit.hemCm, 0))}
            y2={yOf(Math.max(fit.hemCm, 0))}
            className="stroke-primary"
            strokeDasharray="3 3"
            strokeWidth={1}
          />
          <line x1={0} x2={W} y1={yOf(0)} y2={yOf(0)} className="stroke-muted-foreground/50" />
          {(kind === 'top'
            ? [
                ['허리', BODY.waist],
                ['엉덩이', BODY.crotch],
              ]
            : [
                ['무릎', BODY.knee],
                ['발목', BODY.ankle],
              ]
          ).map(([label, ratio]) => (
            <text
              key={label}
              x={W - 4}
              y={at(ratio as number) + 3}
              textAnchor="end"
              className="fill-muted-foreground text-[8px]"
            >
              {label}
            </text>
          ))}
        </svg>
        <figcaption className="space-y-1 text-sm">
          <p className="font-semibold">
            {child.name} {h}cm · {spec.size}
          </p>
          <p>
            {kind === 'top' ? '밑단' : '바지 끝'}: <strong>{fit.hem}</strong>
          </p>
          {fit.sleeve && (
            <p>
              소매: <strong>{fit.sleeve}</strong>
            </p>
          )}
          <p className="text-muted-foreground text-xs">
            아동 평균 신체 비율로 그린 길이 비교용 그림이에요. 실제 착용과 다를 수 있어요.
          </p>
        </figcaption>
      </div>
    </figure>
  )
}
