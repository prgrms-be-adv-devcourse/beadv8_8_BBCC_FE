export type DeadLetterStatus = 'OPEN' | 'REPROCESSED'

/** 처리하지 못해 따로 보관한 Kafka 메시지 한 건 (본문은 서버에만 있다) */
export type DeadLetter = {
  id: string
  status: DeadLetterStatus
  sourceTopic: string
  sourcePartition: number | null
  sourceOffset: number | null
  dltTopic: string
  dltPartition: number
  dltOffset: number
  eventType: string | null
  eventId: string | null
  messageKey: string | null
  failureType: string | null
  replayCount: number
  lastReplayedBy: string | null
  lastReplayedAt: string | null
  lastReplayFailureType: string | null
  createdAt: string
}

export const DEAD_LETTER_STATUS_LABEL: Record<DeadLetterStatus, string> = {
  OPEN: '처리 대기',
  REPROCESSED: '재처리 완료',
}

/** 재처리 응답을 보고 고른 결과 (화면 문구용) */
export type ReprocessOutcome =
  | { kind: 'REPROCESSED' }
  | { kind: 'FAILED'; failureType: string | null }
  | { kind: 'ALREADY_REPROCESSED' }
