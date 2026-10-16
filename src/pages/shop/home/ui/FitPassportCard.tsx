import { Link } from 'react-router'
import {
  ageOf,
  GENDER_LABEL,
  growthMonths,
  sizeBandOf,
  summarizeGrowth,
  useGrowthRecordsQuery,
  type Child,
  type GrowthRecord,
} from '@/entities/child'
import { paths } from '@/shared/config'

/** 키 기록 작은 선 (성장 색) */
function Sparkline({ records }: { records: GrowthRecord[] }) {
  const sorted = [...records].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt))
  if (sorted.length < 2) return null
  const heights = sorted.map((record) => record.heightCm)
  const low = Math.min(...heights)
  const high = Math.max(...heights)
  const points = heights.map((h, i) => {
    const x = 4 + (i / (heights.length - 1)) * 92
    const y = high === low ? 16 : 28 - ((h - low) / (high - low)) * 24
    return [x, y] as const
  })
  return (
    <svg viewBox="0 0 100 32" className="text-growth-deep h-8 w-28" aria-hidden>
      <polyline
        points={points.map(([x, y]) => `${x},${y}`).join(' ')}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.2" fill="currentColor" />
      ))}
    </svg>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'highlight' }) {
  return (
    <div
      className={
        tone === 'highlight'
          ? 'bg-highlight-soft rounded-xl p-3'
          : 'bg-growth-soft/70 rounded-xl p-3'
      }
    >
      <p className="text-muted-foreground text-[11px]">{label}</p>
      <p className="text-lg font-extrabold">{value}</p>
    </div>
  )
}

type FitPassportCardProps = { child: Child | null; onAddChild?: string }

/** 오른쪽 Fit Passport: 자녀 키 · 몸무게 · 추천 사이즈 · 성장 변화 (성장 영역 = 초록) */
export function FitPassportCard({ child }: FitPassportCardProps) {
  return (
    <section
      aria-label="Fit Passport"
      className="flex flex-col gap-3 rounded-3xl border bg-white p-5 md:p-6"
    >
      <h2 className="text-growth-deep flex items-center gap-1.5 text-lg font-extrabold">
        <span aria-hidden>🌱</span> Fit Passport
      </h2>
      {child ? <PassportBody child={child} /> : <PassportEmpty />}
    </section>
  )
}

function PassportBody({ child }: { child: Child }) {
  const records = useGrowthRecordsQuery(child.id)
  const list = records.data ?? []
  const summary = summarizeGrowth(list)
  const months = growthMonths(list)
  const size = sizeBandOf(child.heightCm).size
  return (
    <>
      <div className="flex items-center gap-3">
        <span className="bg-growth-soft text-growth-deep flex size-11 items-center justify-center rounded-full font-bold">
          {child.name.slice(0, 1)}
        </span>
        <div>
          <p className="font-bold">{child.name}</p>
          <p className="text-muted-foreground text-xs">
            {ageOf(child.birthDate)}세 · {GENDER_LABEL[child.gender]}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Stat label="키" value={`${child.heightCm}cm`} />
        <Stat label="몸무게" value={`${child.weightKg}kg`} />
        <Stat label="추천" value={String(size)} tone="highlight" />
      </div>
      <div className="bg-growth-soft/70 flex items-center justify-between rounded-xl px-3 py-2.5">
        <div>
          <p className="text-muted-foreground text-[11px]">
            {months ? `${months}개월 동안` : '성장 기록'}
          </p>
          <p className="text-growth-deep text-lg font-extrabold">
            {summary.heightChangeCm !== null
              ? `${summary.heightChangeCm >= 0 ? '+' : ''}${summary.heightChangeCm}cm`
              : `${summary.count}건`}
          </p>
        </div>
        <Sparkline records={list} />
      </div>
      <Link
        to={paths.shop.child(child.id)}
        className="bg-highlight-soft flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm"
      >
        <span aria-hidden className="text-primary">
          👕
        </span>
        <span className="flex-1">
          <span className="block font-semibold">지금 {size}이 잘 맞아요</span>
          <span className="text-muted-foreground text-xs">최근 키를 반영했어요</span>
        </span>
        <span aria-hidden>›</span>
      </Link>
      <div className="mt-auto flex flex-wrap gap-2 pt-1">
        <Link
          to={paths.shop.child(child.id)}
          className="bg-growth-deep rounded-full px-4 py-2 text-xs font-semibold text-white"
        >
          성장 기록 보기
        </Link>
        <Link
          to={paths.shop.children}
          className="border-growth-deep/40 text-growth-deep rounded-full border border-dashed px-4 py-2 text-xs"
        >
          + 자녀 추가
        </Link>
      </div>
    </>
  )
}

function PassportEmpty() {
  return (
    <div className="flex flex-1 flex-col justify-between gap-4">
      <p className="text-muted-foreground text-sm">
        아이의 키를 기록하면 지금 가장 잘 맞는 사이즈를 알려 드려요. 키가 자라면 추천도 함께
        바뀌어요.
      </p>
      <Link
        to={paths.shop.children}
        className="bg-growth-deep self-start rounded-full px-4 py-2 text-xs font-semibold text-white"
      >
        자녀 프로필 등록하기
      </Link>
    </div>
  )
}
