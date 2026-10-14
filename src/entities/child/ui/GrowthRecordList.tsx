import type { ReactNode } from 'react'
import { formatDateTime } from '@/shared/lib'
import { BODY_TYPE_LABEL, type GrowthRecord, type GrowthSummary } from '../model/child'

type Props = {
  records: GrowthRecord[]
  summary: GrowthSummary
  /** 줄마다 오른쪽 동작 (예: 수정) */
  action?: (record: GrowthRecord) => ReactNode
}

/** 성장 이력: 키 · 체형이 바뀔 때마다 쌓인 기록 (최신이 위) */
export function GrowthRecordList({ records, summary, action }: Props) {
  const sorted = [...records].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
  return (
    <div className="space-y-2">
      <p className="text-sm">
        기록 {summary.count}건
        {summary.heightChangeCm !== null &&
          ` · 처음보다 ${summary.heightChangeCm >= 0 ? '+' : ''}${summary.heightChangeCm.toFixed(1)}cm`}
      </p>
      <ol className="space-y-1">
        {sorted.map((record) => (
          <li
            key={record.id}
            className="flex items-center justify-between border-t pt-1 text-sm"
            aria-label={`성장 기록 ${record.id}`}
          >
            <span>
              {formatDateTime(record.recordedAt)} · {record.heightCm.toFixed(1)}cm
              {record.bodyType && ` · ${BODY_TYPE_LABEL[record.bodyType]}`}
            </span>
            {action?.(record)}
          </li>
        ))}
      </ol>
    </div>
  )
}
