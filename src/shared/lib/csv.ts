/** CSV 한 칸: 쉼표 · 따옴표 · 줄바꿈이 있으면 따옴표로 감싸고 따옴표는 두 번 */
function cell(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? '' : String(value)
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export type CsvColumn<T> = { header: string; value: (row: T) => string | number | null | undefined }

/** 표 → CSV 글자 (첫 줄 머리글, 줄바꿈 CRLF) */
export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const lines = [
    columns.map((column) => cell(column.header)).join(','),
    ...rows.map((row) => columns.map((column) => cell(column.value(row))).join(',')),
  ]
  return lines.join('\r\n')
}

/** CSV 파일 내려받기. 엑셀에서 한글이 깨지지 않게 BOM을 붙인다 */
export function downloadCsv(fileName: string, csv: string) {
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName.endsWith('.csv') ? fileName : `${fileName}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

/** 정렬: 숫자는 크기, 글자는 한국어 순서. null은 맨 뒤 */
export function compareValues(
  a: string | number | null | undefined,
  b: string | number | null | undefined,
): number {
  if (a === b) return 0
  if (a === null || a === undefined) return 1
  if (b === null || b === undefined) return -1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), 'ko', { numeric: true })
}
