import type { ReactNode } from 'react'
import { formatDateTime } from '@/shared/lib'
import { BODY_TYPE_LABEL, type GrowthRecord, type GrowthSummary } from '../model/child'
import { growthTimeline } from '../model/child.rules'

type GrowthRecordListProps = {
  records: GrowthRecord[]
  summary: GrowthSummary
  /** 줄마다 오른쪽 동작 (예: 수정) */
  action?: (record: GrowthRecord) => ReactNode
}

/** 성장 이력: 키 · 체형이 바뀔 때마다 쌓인 기록 (최신이 위). 줄마다 바로 앞 기록보다 큰 만큼 */
export function GrowthRecordList({ records, summary, action }: GrowthRecordListProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <p className="text-sm font-bold">기록 {summary.count}건</p>
        {summary.heightChangeCm !== null && (
          <p className="text-muted-foreground figure text-[13px]">
            처음보다 {summary.heightChangeCm >= 0 ? '+' : ''}
            {summary.heightChangeCm.toFixed(1)}cm
          </p>
        )}
      </div>
      <ol className="divide-border border-border divide-y border-y">
        {growthTimeline(records).map(({ record, changeCm }) => (
          <li
            key={record.id}
            className="flex items-center justify-between gap-3 py-3"
            aria-label={`성장 기록 ${record.id}`}
          >
            <div className="min-w-0 space-y-0.5">
              <p className="flex flex-wrap items-baseline gap-x-2">
                <span className="figure text-[15px] font-bold">{record.heightCm.toFixed(1)}cm</span>
                {changeCm !== null && changeCm !== 0 && (
                  <span className="text-muted-foreground figure text-xs font-semibold">
                    {changeCm > 0 ? '+' : ''}
                    {changeCm.toFixed(1)}
                  </span>
                )}
                {record.bodyType && (
                  <span className="bg-muted text-muted-foreground inline-flex h-5 items-center rounded-sm px-1.5 text-[11px] font-medium">
                    {BODY_TYPE_LABEL[record.bodyType]}
                  </span>
                )}
              </p>
              <p className="text-muted-foreground figure text-xs">
                {formatDateTime(record.recordedAt)}
              </p>
            </div>
            {action?.(record)}
          </li>
        ))}
      </ol>
    </div>
  )
}
