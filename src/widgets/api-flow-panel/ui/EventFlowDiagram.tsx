import { useState } from 'react'
import { cn } from '@/shared/lib'
import { DOMAINS, type DomainId } from '../config/domain-flow'
import type { EdgeState, EventTimeline } from '../model/event-timeline'

// 도메인 자리 (viewBox 400 × 250). 주문을 가운데, 상품 · 결제를 아래 양옆에 두어 오가는 이벤트 곡선이 겹치지 않게.
// 외부(카카오 · 토스)는 위 끝에
const NODE: Record<DomainId, { x: number; y: number }> = {
  kakao: { x: 45, y: 28 },
  member: { x: 145, y: 28 },
  recommend: { x: 255, y: 28 },
  toss: { x: 355, y: 28 },
  order: { x: 200, y: 118 },
  product: { x: 58, y: 200 },
  payment: { x: 342, y: 200 },
  settlement: { x: 200, y: 228 },
}
const HALF_W = 38
const HALF_H = 15
const STEP_DELAY_S = 0.55

const STATE_COLOR: Record<EdgeState, string> = {
  done: 'var(--primary)',
  pending: '#9ca3af',
  failed: 'var(--destructive)',
  compensate: '#d97706',
}
const STATE_LABEL: Record<EdgeState, string> = {
  done: '끝남',
  pending: '기다리는 중',
  failed: '실패',
  compensate: '보상',
}

type Point = { x: number; y: number }

/** 노드 사각형 가장자리에서 시작 · 끝나는 곡선. 같은 두 도메인 사이 여러 이벤트는 휘는 정도를 달리한다 */
function edgePath(from: DomainId, to: DomainId, lane: number) {
  const a = NODE[from]
  const b = NODE[to]
  if (from === to) {
    // 같은 도메인 안에서 끝나는 일 (예: 결제 시간 초과): 노드 위로 고리
    const top = a.y - HALF_H
    return {
      d: `M ${a.x - 14} ${top} C ${a.x - 30} ${top - 34}, ${a.x + 30} ${top - 34}, ${a.x + 14} ${top}`,
      mid: { x: a.x, y: top - 26 },
    }
  }
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = Math.hypot(dx, dy)
  const edge = (p: Point, sign: number) => {
    const t = Math.min(HALF_W / Math.abs(dx || 1e-6), HALF_H / Math.abs(dy || 1e-6))
    return { x: p.x + sign * dx * t, y: p.y + sign * dy * t }
  }
  const start = edge(a, 1)
  const end = edge(b, -1)
  const bend = 22 + lane * 22
  const control = {
    x: (start.x + end.x) / 2 + (-dy / len) * bend,
    y: (start.y + end.y) / 2 + (dx / len) * bend,
  }
  return {
    d: `M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`,
    // 곡선의 가운데 (t = 0.5)
    mid: {
      x: 0.25 * start.x + 0.5 * control.x + 0.25 * end.x,
      y: 0.25 * start.y + 0.5 * control.y + 0.25 * end.y,
    },
  }
}

type EventFlowDiagramProps = { timeline: EventTimeline | null }

/**
 * 마지막 행동 뒤 서버에서 이어진 이벤트를 도메인 사이 화살표로 순서대로 그린다 (설계 기준).
 * 주문하기는 실제 조회 결과에 따라 진행 중 · 실패 · 보상(재고 복구)까지 보여 준다
 */
export function EventFlowDiagram({ timeline }: EventFlowDiagramProps) {
  const [replay, setReplay] = useState(0)
  const touched = new Set<DomainId>(
    timeline?.steps.flatMap((step) => [step.from, ...step.to]) ?? [],
  )
  const lanes = new Map<string, number>()
  const edges =
    timeline?.steps.flatMap((step, index) =>
      step.to.map((to) => {
        const pair = `${step.from}>${to}`
        const lane = lanes.get(pair) ?? 0
        lanes.set(pair, lane + 1)
        return { step, index, to, ...edgePath(step.from, to, lane) }
      }),
    ) ?? []

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold">서버 이벤트 흐름</h2>
        {timeline && (
          <>
            <span className="text-muted-foreground text-[11px]">
              {timeline.title} · {clockOf(timeline.at)}
            </span>
            {timeline.outcome && (
              <span
                className={cn(
                  'rounded px-1.5 py-0.5 text-[11px] font-semibold',
                  timeline.outcome.tone === 'success' && 'bg-green-100 text-green-800',
                  timeline.outcome.tone === 'pending' && 'bg-muted text-muted-foreground',
                  timeline.outcome.tone === 'fail' && 'bg-destructive/10 text-destructive',
                )}
              >
                {timeline.outcome.text}
              </span>
            )}
            <button
              type="button"
              className="text-primary ml-auto text-[11px] underline"
              onClick={() => setReplay((value) => value + 1)}
            >
              다시 보기
            </button>
          </>
        )}
      </div>

      <svg
        key={`${timeline?.signature ?? 'none'}-${replay}`}
        viewBox="0 0 400 250"
        className="w-full"
        role="img"
        aria-label={
          timeline
            ? `서버 이벤트 흐름: ${timeline.steps.map((step) => step.name).join(' → ')}`
            : '서버 이벤트 흐름 (아직 없음)'
        }
      >
        <defs>
          {(Object.keys(STATE_COLOR) as EdgeState[]).map((state) => (
            <marker
              key={state}
              id={`flow-arrow-${state}`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" style={{ fill: STATE_COLOR[state] }} />
            </marker>
          ))}
        </defs>

        {DOMAINS.map((domain) => {
          const { x, y } = NODE[domain.id]
          const origin = timeline?.origin === domain.id
          const active = touched.has(domain.id)
          return (
            <g key={domain.id}>
              <rect
                x={x - HALF_W}
                y={y - HALF_H}
                width={HALF_W * 2}
                height={HALF_H * 2}
                rx="7"
                strokeDasharray={domain.external ? '4 3' : undefined}
                style={{
                  fill: origin ? 'var(--primary)' : 'white',
                  stroke: origin || active ? 'var(--primary)' : '#d4d4d8',
                  strokeWidth: active ? 2 : 1,
                }}
              />
              <text
                x={x}
                y={y + 4}
                textAnchor="middle"
                className="text-[11px]"
                style={{
                  fill: origin ? 'white' : active ? 'var(--primary)' : '#a1a1aa',
                  fontWeight: origin || active ? 700 : 400,
                }}
              >
                {domain.name}
              </text>
            </g>
          )
        })}

        {edges.map(({ step, index, to, d, mid }) => {
          const delay = `${index * STEP_DELAY_S}s`
          const color = STATE_COLOR[step.state]
          return (
            <g key={`${index}-${to}`} className="flow-fade" style={{ animationDelay: delay }}>
              <path
                d={d}
                pathLength={1}
                fill="none"
                className={step.state === 'pending' ? 'flow-pending' : 'flow-draw'}
                style={{ stroke: color, strokeWidth: 2, animationDelay: delay }}
                markerEnd={`url(#flow-arrow-${step.state})`}
              />
              <circle cx={mid.x} cy={mid.y} r="8" style={{ fill: color }} />
              <text
                x={mid.x}
                y={mid.y + 3.5}
                textAnchor="middle"
                className="text-[10px] font-bold"
                style={{ fill: 'white' }}
              >
                {index + 1}
              </text>
            </g>
          )
        })}
      </svg>

      {timeline ? (
        <ol className="space-y-1">
          {timeline.steps.map((step, index) => (
            <li
              key={`${index}-${step.name}`}
              className="flow-fade flex gap-2 text-[11px]"
              style={{ animationDelay: `${index * STEP_DELAY_S}s` }}
            >
              <span
                className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ backgroundColor: STATE_COLOR[step.state] }}
              >
                {index + 1}
              </span>
              <span className="min-w-0">
                <span className="font-mono font-semibold">{step.name}</span>{' '}
                <span className="text-muted-foreground">
                  {nameOf(step.from)} → {step.to.map(nameOf).join(' · ')} ·{' '}
                  {STATE_LABEL[step.state]}
                </span>
                <span className="text-muted-foreground block">{step.description}</span>
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-muted-foreground text-[11px]">
          주문하기 · 판매 시작처럼 서버 처리가 이어지는 행동을 하면, 도메인 사이 이벤트를 순서대로
          그려요.
        </p>
      )}
    </div>
  )
}

/** 시:분:초 (내 컴퓨터 시각) */
function clockOf(iso: string): string {
  const date = new Date(iso)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function nameOf(id: DomainId): string {
  return DOMAINS.find((domain) => domain.id === id)?.name ?? id
}
