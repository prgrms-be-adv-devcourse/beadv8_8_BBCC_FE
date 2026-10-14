import type { AxiosResponse } from 'axios'
import { useApiFlowLog } from './api-flow-log'

/**
 * 응답이 계약(DTO 모양)과 맞는지 검사한다. 화면은 매퍼가 흡수해 그대로 동작하고, 다른 곳은 흐름 패널에 표시한다.
 * 패키지 없이 쓰는 작은 모양 표기법: str · num · bool · oneOf · obj · arr · nullable
 */
export type Shape =
  | { kind: 'string' | 'number' | 'boolean'; nullable?: boolean }
  | { kind: 'enum'; values: readonly string[]; nullable?: boolean }
  | { kind: 'object'; fields: Record<string, Shape>; nullable?: boolean }
  | { kind: 'array'; item: Shape; nullable?: boolean }

export type ContractIssue = {
  /** 필드 경로 (예: items[0].status) */
  path: string
  /** missing 없음 · type 타입 다름 · enum 값 다름 · extra 계약에 없는 필드(백엔드가 추가) */
  type: 'missing' | 'type' | 'enum' | 'extra'
  expected: string
  actual: string
}

export const str: Shape = { kind: 'string' }
export const num: Shape = { kind: 'number' }
export const bool: Shape = { kind: 'boolean' }
export const oneOf = (values: readonly string[]): Shape => ({ kind: 'enum', values })
export const obj = (fields: Record<string, Shape>): Shape => ({ kind: 'object', fields })
export const arr = (item: Shape): Shape => ({ kind: 'array', item })
export const nullable = (shape: Shape): Shape => ({ ...shape, nullable: true })
/** 백엔드 PageResponse */
export const pageOf = (item: Shape): Shape =>
  obj({
    content: arr(item),
    page: num,
    size: num,
    totalElements: num,
    totalPages: num,
    hasNext: bool,
  })

function describe(shape: Shape): string {
  const base =
    shape.kind === 'enum'
      ? shape.values.join(' | ')
      : shape.kind === 'object'
        ? 'object'
        : shape.kind === 'array'
          ? 'array'
          : shape.kind
  return shape.nullable ? `${base} | null` : base
}

function typeOf(value: unknown): string {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value
}

export function validate(value: unknown, shape: Shape, path = ''): ContractIssue[] {
  const at = path || '(응답)'
  if (value === undefined) {
    return shape.nullable
      ? []
      : [{ path: at, type: 'missing', expected: describe(shape), actual: '없음' }]
  }
  if (value === null) {
    return shape.nullable
      ? []
      : [{ path: at, type: 'type', expected: describe(shape), actual: 'null' }]
  }
  switch (shape.kind) {
    case 'string':
    case 'number':
    case 'boolean':
      return typeof value === shape.kind
        ? []
        : [
            {
              path: at,
              type: 'type',
              expected: describe(shape),
              actual: `${typeOf(value)} (${JSON.stringify(value)})`,
            },
          ]
    case 'enum':
      return typeof value === 'string' && shape.values.includes(value)
        ? []
        : [{ path: at, type: 'enum', expected: describe(shape), actual: JSON.stringify(value) }]
    case 'array':
      if (!Array.isArray(value))
        return [{ path: at, type: 'type', expected: 'array', actual: typeOf(value) }]
      return value.flatMap((item, index) => validate(item, shape.item, `${path}[${index}]`))
    case 'object': {
      if (typeOf(value) !== 'object')
        return [{ path: at, type: 'type', expected: 'object', actual: typeOf(value) }]
      const record = value as Record<string, unknown>
      const issues = Object.entries(shape.fields).flatMap(([key, field]) =>
        validate(record[key], field, path ? `${path}.${key}` : key),
      )
      const extras = Object.keys(record)
        .filter((key) => !(key in shape.fields))
        .map((key) => ({
          path: path ? `${path}.${key}` : key,
          type: 'extra' as const,
          expected: '(계약에 없음)',
          actual: typeOf(record[key]),
        }))
      return [...issues, ...extras]
    }
  }
}

/** 배열 안 같은 위치 문제는 한 번만 보이도록 [0] · [1]을 [*]로 묶는다 */
function dedupe(issues: ContractIssue[]): ContractIssue[] {
  const seen = new Map<string, ContractIssue>()
  for (const issue of issues) {
    const path = issue.path.replace(/\[\d+\]/g, '[*]')
    const key = `${path}|${issue.type}|${issue.actual}`
    if (!seen.has(key)) seen.set(key, { ...issue, path })
  }
  return [...seen.values()]
}

/** 요청 함수에서 `.then(expectShape(shape))`로 쓴다. 검사 결과를 그 호출 기록에 붙이고 data를 돌려준다 */
export function expectShape<T>(shape: Shape) {
  return (response: AxiosResponse<T>): T => {
    const issues = dedupe(validate(response.data, shape))
    if (issues.length > 0 && response.config.logId !== undefined) {
      useApiFlowLog.getState().attachContractIssues(response.config.logId, issues)
    }
    return response.data
  }
}
