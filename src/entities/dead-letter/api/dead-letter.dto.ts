/** BE {모듈}DeadLetterResponse (네 모듈 같은 칸). 메시지 본문은 응답에 없다 */
export type DeadLetterDto = {
  deadLetterId: string
  /** OPEN · REPROCESSED */
  status: string
  sourceTopic: string
  /** 원래 위치 헤더가 없던 메시지는 null */
  sourcePartition: number | null
  sourceOffset: number | null
  dltTopic: string
  dltPartition: number
  dltOffset: number
  eventType: string | null
  eventId: string | null
  messageKey: string | null
  /** 실패 예외 클래스 이름. 헤더가 없던 메시지는 null */
  failureType: string | null
  replayCount: number
  /** 마지막으로 재처리한 관리자 번호 */
  lastReplayedBy: string | null
  lastReplayedAt: string | null
  /** 마지막 재처리가 실패했을 때만 예외 클래스 이름 */
  lastReplayFailureType: string | null
  createdAt: string
}
