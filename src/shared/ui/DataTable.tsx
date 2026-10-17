import { useState, type ReactNode } from 'react'
import { cn, compareValues, downloadCsv, toCsv } from '@/shared/lib'

export type DataColumn<T> = {
  key: string
  header: string
  cell: (row: T) => ReactNode
  /** 있으면 머리글을 눌러 정렬 */
  sortValue?: (row: T) => string | number | null
  /** CSV 값 (없으면 sortValue, 그것도 없으면 빈칸) */
  csvValue?: (row: T) => string | number | null
  align?: 'right'
}

type DataTableProps<T> = {
  label: string
  rows: T[]
  columns: DataColumn<T>[]
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
  pageSize?: number
  emptyText?: string
  /** 있으면 "CSV 내려받기" (정렬된 전체 목록) */
  csvFileName?: string
}

/** 관리자 공통 표: 정렬 · 페이지 넘김 · 건수 · CSV · 행 누르면 상세 */
export function DataTable<T>({
  label,
  rows,
  columns,
  rowKey,
  onRowClick,
  pageSize = 10,
  emptyText = '목록이 비었어요.',
  csvFileName,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; desc: boolean } | null>(null)
  const [page, setPage] = useState(0)
  const sortColumn = columns.find((column) => column.key === sort?.key)
  const sorted =
    sort && sortColumn?.sortValue
      ? [...rows].sort(
          (a, b) =>
            compareValues(sortColumn.sortValue!(a), sortColumn.sortValue!(b)) *
            (sort.desc ? -1 : 1),
        )
      : rows
  const pages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const current = Math.min(page, pages - 1)
  const visible = sorted.slice(current * pageSize, (current + 1) * pageSize)

  const toggleSort = (key: string) =>
    setSort((prev) => (prev?.key === key ? { key, desc: !prev.desc } : { key, desc: false }))

  const exportCsv = () =>
    downloadCsv(
      csvFileName!,
      toCsv(
        sorted,
        columns.map((column) => ({
          header: column.header,
          value: (row: T) => (column.csvValue ?? column.sortValue)?.(row) ?? '',
        })),
      ),
    )

  return (
    <div className="space-y-2">
      <div className="text-muted-foreground flex items-center justify-between text-sm">
        <span>{rows.length}건</span>
        {csvFileName && rows.length > 0 && (
          <button type="button" onClick={exportCsv} className="underline">
            CSV 내려받기
          </button>
        )}
      </div>
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table aria-label={label} className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground text-left text-xs">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={
                    sort?.key === column.key ? (sort.desc ? 'descending' : 'ascending') : undefined
                  }
                  className={cn(
                    'px-3 py-2 font-medium whitespace-nowrap',
                    column.align === 'right' && 'text-right',
                  )}
                >
                  {column.sortValue ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(column.key)}
                      className="hover:text-foreground"
                    >
                      {column.header}
                      {sort?.key === column.key ? (sort.desc ? ' ↓' : ' ↑') : ' ↕'}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-muted-foreground px-3 py-8 text-center"
                >
                  {emptyText}
                </td>
              </tr>
            )}
            {visible.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn('border-t', onRowClick && 'hover:bg-primary-soft/50 cursor-pointer')}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      'px-3 py-2 whitespace-nowrap',
                      column.align === 'right' && 'text-right',
                    )}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <nav aria-label={`${label} 쪽`} className="flex items-center justify-center gap-1 text-sm">
          <button
            type="button"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
            className="rounded px-2 py-1 disabled:opacity-40"
          >
            이전
          </button>
          {Array.from({ length: pages }, (_, index) => (
            <button
              key={index}
              type="button"
              aria-current={index === current ? 'page' : undefined}
              onClick={() => setPage(index)}
              className={cn(
                'size-8 rounded',
                index === current ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
              )}
            >
              {index + 1}
            </button>
          ))}
          <button
            type="button"
            disabled={current === pages - 1}
            onClick={() => setPage(current + 1)}
            className="rounded px-2 py-1 disabled:opacity-40"
          >
            다음
          </button>
        </nav>
      )}
    </div>
  )
}
