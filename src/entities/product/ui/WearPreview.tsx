import { useState } from 'react'
import { cn } from '@/shared/lib'
import type { SizeSpec } from '../model/product'
import { BODY, garmentKindOf, wearFitOf } from '../model/wear-preview'

type WearPreviewProps = {
  specs: SizeSpec[]
  child: { name: string; heightCm: number }
  /** 처음 보여 줄 사이즈 (추천 사이즈) */
  initialSize?: string | null
  /** 짧게: 그림 옆에는 밑단 · 소매 한 줄씩만 (쇼핑 상세). 콘솔은 설명까지 다 보인다 */
  isCompact?: boolean
}

const SCALE = 1.5 // 1cm = 1.5 단위
const W = 170

type Point = { x: number; y: number }

/** 두 점을 잇는 굵은 띠(소매 · 바짓가랑이)를 네 꼭짓점 경로로 */
function band(from: Point, to: Point, width: number): string {
  const len = Math.hypot(to.x - from.x, to.y - from.y) || 1
  const nx = (-(to.y - from.y) / len) * (width / 2)
  const ny = ((to.x - from.x) / len) * (width / 2)
  return `M ${from.x + nx} ${from.y + ny} L ${to.x + nx} ${to.y + ny} L ${to.x - nx} ${to.y - ny} L ${from.x - nx} ${from.y - ny} Z`
}

/**
 * 아이 키에 맞춘 실루엣 위에 사이즈별 옷 길이를 겹쳐 그린다 (아동 평균 비율, 길이 비교용).
 * 몸은 둥근 마네킹 모양(단발 머리 · 손 · 신발), 옷은 목둘레 · 소매 · 밑단이 있는 실제 옷 모양
 */
export function WearPreview({ specs, child, initialSize, isCompact = false }: WearPreviewProps) {
  const drawable = specs.filter((spec) => garmentKindOf(spec) !== null)
  const [picked, setPicked] = useState<string | null>(null)
  if (drawable.length === 0) return null
  const spec = drawable.find((item) => item.size === (picked ?? initialSize)) ?? drawable[0]
  const kind = garmentKindOf(spec)!
  const fit = wearFitOf(spec, child.heightCm)!
  const h = child.heightCm
  const u = h * SCALE // 키 전체 길이 (그림 단위)
  const viewH = u + 12
  const yOf = (cm: number) => viewH - 6 - cm * SCALE
  const at = (ratio: number) => yOf(ratio * h)
  const cx = W / 2 - 12
  // 몸 치수 (키 대비 비율)
  const headR = 0.068 * u
  const headCy = at(0.915)
  const neckHalf = 0.026 * u
  const shoulderHalf = 0.105 * u
  const waistHalf = 0.082 * u
  const hipHalf = 0.092 * u
  const armWidth = 0.048 * u
  const shoulderY = at(BODY.shoulder) + 0.02 * u
  const crotchY = at(BODY.crotch)
  // 팔: 어깨 끝 → 손목 (살짝 벌린 채로 내림)
  const armStart = (side: 1 | -1): Point => ({
    x: cx + side * (shoulderHalf - 0.02 * u),
    y: shoulderY,
  })
  const wrist = (side: 1 | -1): Point => ({
    x: cx + side * (shoulderHalf + 0.05 * u),
    y: at(BODY.shoulder - BODY.arm),
  })
  const armLen = Math.hypot(wrist(1).x - armStart(1).x, wrist(1).y - armStart(1).y)
  const sleeveRatio = fit.sleeveCm ? Math.min(1.15, (fit.sleeveCm * SCALE) / armLen) : 0
  const sleeveEnd = (side: 1 | -1): Point => ({
    x: armStart(side).x + (wrist(side).x - armStart(side).x) * sleeveRatio,
    y: armStart(side).y + (wrist(side).y - armStart(side).y) * sleeveRatio,
  })
  const hemY = yOf(Math.max(fit.hemCm, 0))
  const torso = `M ${cx - neckHalf * 1.6} ${at(0.815)} Q ${cx - shoulderHalf} ${at(0.815)} ${cx - shoulderHalf} ${shoulderY + 0.02 * u} L ${cx - waistHalf} ${at(BODY.waist)} L ${cx - hipHalf} ${at(BODY.hip)} L ${cx - hipHalf} ${crotchY} L ${cx + hipHalf} ${crotchY} L ${cx + hipHalf} ${at(BODY.hip)} L ${cx + waistHalf} ${at(BODY.waist)} L ${cx + shoulderHalf} ${shoulderY + 0.02 * u} Q ${cx + shoulderHalf} ${at(0.815)} ${cx + neckHalf * 1.6} ${at(0.815)} Z`
  const leg = (side: 1 | -1) =>
    `M ${cx + side * hipHalf} ${at(BODY.hip)} L ${cx + side * 0.006 * u} ${at(BODY.hip)} L ${cx + side * 0.014 * u} ${at(0.05)} L ${cx + side * (hipHalf - 0.03 * u)} ${at(0.05)} Z`
  // 단발: 정수리에서 귀 높이까지 감싸고 앞머리는 이마 위에서 둥글게
  const hair = `M ${cx - headR * 1.1} ${headCy + headR * 0.6} C ${cx - headR * 1.3} ${headCy - headR * 1.8} ${cx + headR * 1.3} ${headCy - headR * 1.8} ${cx + headR * 1.1} ${headCy + headR * 0.6} L ${cx + headR * 0.82} ${headCy + headR * 0.6} Q ${cx + headR * 0.85} ${headCy - headR * 0.05} ${cx} ${headCy - headR * 0.12} Q ${cx - headR * 0.85} ${headCy - headR * 0.05} ${cx - headR * 0.82} ${headCy + headR * 0.6} Z`
  // 옷: 상의는 목둘레 → 어깨 → 살짝 퍼지는 밑단, 하의는 허리 → 두 바짓가랑이
  const topHemHalf = shoulderHalf + 0.018 * u
  const top = `M ${cx - neckHalf * 1.8} ${at(0.815)} Q ${cx} ${at(0.785)} ${cx + neckHalf * 1.8} ${at(0.815)} L ${cx + shoulderHalf + 0.01 * u} ${shoulderY} L ${cx + topHemHalf} ${hemY} Q ${cx} ${hemY + 0.012 * u} ${cx - topHemHalf} ${hemY} L ${cx - shoulderHalf - 0.01 * u} ${shoulderY} Z`
  const pantsHem = Math.max(hemY, crotchY + 4)
  const pantHalf = hipHalf + 0.012 * u
  const pants = `M ${cx - waistHalf - 0.012 * u} ${at(BODY.waist)} L ${cx + waistHalf + 0.012 * u} ${at(BODY.waist)} L ${cx + pantHalf} ${at(BODY.hip)} L ${cx + pantHalf - 0.008 * u} ${pantsHem} L ${cx + 0.002 * u} ${pantsHem} L ${cx} ${crotchY + 0.012 * u} L ${cx - 0.002 * u} ${pantsHem} L ${cx - pantHalf + 0.008 * u} ${pantsHem} L ${cx - pantHalf} ${at(BODY.hip)} Z`
  const landmarks = (
    kind === 'top'
      ? [
          ['허리', BODY.waist],
          ['엉덩이', BODY.crotch],
        ]
      : [
          ['무릎', BODY.knee],
          ['발목', BODY.ankle],
        ]
  ) as [string, number][]

  return (
    <figure className="space-y-3">
      <div
        className="flex flex-wrap items-center gap-1.5 text-xs"
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
              'focus-visible:outline-primary h-7 min-w-11 rounded-full border px-2.5 font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 active:translate-y-px disabled:opacity-50',
              item.size === spec.size
                ? 'border-primary bg-primary text-primary-foreground'
                : 'bg-card text-muted-foreground hover:text-foreground',
            )}
          >
            {item.size}
          </button>
        ))}
      </div>
      <div className="flex items-end gap-5">
        <svg
          viewBox={`0 0 ${W} ${viewH}`}
          role="img"
          aria-label={`${child.name} 키 ${h}cm에 ${spec.size} 사이즈: ${fit.hem}${fit.sleeve ? `, 소매는 ${fit.sleeve}` : ''}`}
          className="h-60 w-auto shrink-0"
        >
          {/* 바닥 */}
          <line x1={0} x2={W} y1={yOf(0)} y2={yOf(0)} className="stroke-border" />
          {/* 몸 (아동 평균 비율 마네킹) */}
          <g className="fill-paper-3">
            {([-1, 1] as const).map((side) => (
              <g key={side}>
                <line
                  x1={armStart(side).x}
                  y1={armStart(side).y}
                  x2={wrist(side).x}
                  y2={wrist(side).y}
                  className="stroke-paper-3"
                  strokeWidth={armWidth}
                  strokeLinecap="round"
                />
                <circle cx={wrist(side).x} cy={wrist(side).y + 0.012 * u} r={0.028 * u} />
                <path d={leg(side)} />
              </g>
            ))}
            <rect x={cx - neckHalf} y={at(0.86)} width={neckHalf * 2} height={0.06 * u} rx={2} />
            <path d={torso} />
            <circle cx={cx} cy={headCy} r={headR} />
          </g>
          <path d={hair} className="fill-muted-foreground/55" />
          {([-1, 1] as const).map((side) => (
            <ellipse
              key={side}
              cx={cx + side * (hipHalf / 2 + 0.004 * u)}
              cy={yOf(0) - 0.016 * u}
              rx={0.046 * u}
              ry={0.02 * u}
              className="fill-muted-foreground/60"
            />
          ))}
          {/* 옷 */}
          <g className="fill-primary/25 stroke-primary" strokeWidth={1.4} strokeLinejoin="round">
            {kind === 'top' ? (
              <>
                {fit.sleeveCm !== null &&
                  ([-1, 1] as const).map((side) => (
                    <path key={side} d={band(armStart(side), sleeveEnd(side), armWidth * 1.4)} />
                  ))}
                <path d={top} />
              </>
            ) : (
              <path d={pants} />
            )}
          </g>
          {/* 몸 기준선 이름 */}
          {/* 밑단 표시와 겹치는 기준선 이름은 뺀다 */}
          {landmarks
            .filter(([, ratio]) => Math.abs(at(ratio) - hemY) >= 12)
            .map(([label, ratio]) => (
              <g key={label}>
                <line
                  x1={cx + shoulderHalf + 0.06 * u}
                  x2={W - 34}
                  y1={at(ratio)}
                  y2={at(ratio)}
                  className="stroke-border"
                  strokeDasharray="1 3"
                />
                <text
                  x={W - 2}
                  y={at(ratio) + 3.5}
                  textAnchor="end"
                  className="fill-muted-foreground text-[10px]"
                >
                  {label}
                </text>
              </g>
            ))}
          {/* 밑단 위치 */}
          <line
            x1={4}
            x2={W - 34}
            y1={hemY}
            y2={hemY}
            className="stroke-primary"
            strokeDasharray="4 3"
            strokeWidth={1.2}
          />
          <text
            x={W - 2}
            y={hemY + 3.5}
            textAnchor="end"
            className="fill-primary text-[10px] font-bold"
          >
            {kind === 'top' ? '밑단' : '끝'}
          </text>
        </svg>
        <figcaption className="space-y-1 text-sm">
          {!isCompact && (
            <p className="font-semibold">
              {child.name} {h}cm · {spec.size}
            </p>
          )}
          <p>
            {kind === 'top' ? '밑단' : '바지 끝'}: <strong>{fit.hem}</strong>
          </p>
          {fit.sleeve && (
            <p>
              소매: <strong>{fit.sleeve}</strong>
            </p>
          )}
          <p className="text-muted-foreground text-xs">
            {isCompact
              ? '평균 체형으로 그린 길이 비교예요.'
              : '아동 평균 신체 비율로 그린 길이 비교용 그림이에요. 실제 착용과 다를 수 있어요.'}
          </p>
        </figcaption>
      </div>
    </figure>
  )
}
