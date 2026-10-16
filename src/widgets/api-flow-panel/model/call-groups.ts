import { isFailedCall, type ApiCallLog } from '@/shared/api'

export type CallGroup = {
  /** 시연 단계 (①~⑦ · 시작 · 확인). 콘솔 밖 호출은 '기타' */
  step: string
  logs: ApiCallLog[]
  failed: number
  /** 이 묶음의 행동 이름 (중복 없이, 처음 나온 순서) */
  actions: string[]
}

const OTHER = '기타'

/**
 * 호출을 단계별로 묶는다. 같은 단계가 이어지는 동안 한 묶음이고, 다른 단계를 거쳐 다시 오면 새 묶음.
 * 최신 묶음이 앞 (화면 위)
 */
export function groupCallsByStep(logs: ApiCallLog[]): CallGroup[] {
  const groups: CallGroup[] = []
  for (const log of logs) {
    const step = log.step ?? OTHER
    let group = groups.at(-1)
    if (!group || group.step !== step) {
      group = { step, logs: [], failed: 0, actions: [] }
      groups.push(group)
    }
    group.logs.push(log)
    if (isFailedCall(log)) group.failed += 1
    const action = log.action?.replace(/^자동 시연 · /, '')
    if (action && !group.actions.includes(action)) group.actions.push(action)
  }
  return groups.reverse()
}

/** "방금 호출" 카드에 올릴 호출: 가장 최근 실패, 없으면 가장 최근 행동 호출, 없으면 마지막 호출 */
export function spotlightCall(logs: ApiCallLog[], isKey: (log: ApiCallLog) => boolean) {
  const recent = logs.slice(-30)
  const lastFailed = [...recent].reverse().find(isFailedCall)
  const last = logs.at(-1)
  if (lastFailed && last && lastFailed.id >= last.id - 5) return lastFailed
  return [...logs].reverse().find(isKey) ?? last ?? null
}

const KEY_FIELDS = [
  'status',
  'orderId',
  'productId',
  'sellerOrderId',
  'settlementId',
  'id',
  'totalAmount',
  'amount',
  'balance',
  'availableQuantity',
  'recommendedSize',
  'cancelReason',
  'successCount',
  'failCount',
]

/** 응답 핵심 값 몇 개 (status · 번호 · 금액 등). 목록이면 건수, 오류면 detail */
export function summarizeResponse(body: unknown): string[] {
  if (body === null || body === undefined || body === '') return []
  if (Array.isArray(body)) return [`${body.length}건`]
  if (typeof body !== 'object') return [String(body).slice(0, 60)]
  const record = body as Record<string, unknown>
  if (typeof record.detail === 'string' && typeof record.title === 'string') return [record.detail]
  if (Array.isArray(record.content)) return [`${record.content.length}건`]
  return KEY_FIELDS.filter(
    (key) => record[key] !== undefined && record[key] !== null && typeof record[key] !== 'object',
  )
    .slice(0, 4)
    .map((key) =>
      typeof record[key] === 'number' && /amount|balance/i.test(key)
        ? `${key} ${(record[key] as number).toLocaleString()}`
        : `${key} ${String(record[key])}`,
    )
}
