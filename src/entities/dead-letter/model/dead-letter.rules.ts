import { DEAD_LETTER_MODULES, type DeadLetterModule } from '../config/dead-letter-modules'
import {
  DEAD_LETTER_STATUS_LABEL,
  type DeadLetter,
  type DeadLetterStatus,
  type ReprocessOutcome,
} from './dead-letter'

export function canReprocess(deadLetter: DeadLetter): boolean {
  return deadLetter.status === 'OPEN'
}

/**
 * 재처리 응답은 성공 · 실패 모두 200이라 응답만으로 결과를 고른다.
 * 재처리 완료인데 횟수가 그대로면 서버가 다시 실행하지 않은 것이다 (먼저 누가 재처리함)
 */
export function reprocessOutcomeOf(
  previousReplayCount: number,
  result: DeadLetter,
): ReprocessOutcome {
  if (result.status === 'OPEN') {
    return { kind: 'FAILED', failureType: result.lastReplayFailureType }
  }
  return result.replayCount > previousReplayCount
    ? { kind: 'REPROCESSED' }
    : { kind: 'ALREADY_REPROCESSED' }
}

export function exceptionShortName(className: string): string {
  return className.slice(className.lastIndexOf('.') + 1)
}

export function isDeadLetterModule(value: string | null | undefined): value is DeadLetterModule {
  return value != null && Object.hasOwn(DEAD_LETTER_MODULES, value)
}

/** 주소의 ?module= → 모듈. 없거나 모르는 값은 인증 */
export function deadLetterModuleOf(value: string | null): DeadLetterModule {
  return isDeadLetterModule(value) ? value : 'auth'
}

/** 주소의 ?status= → 상태. 없거나 모르는 값은 처리 대기 */
export function deadLetterStatusOf(value: string | null): DeadLetterStatus {
  return value !== null && Object.hasOwn(DEAD_LETTER_STATUS_LABEL, value)
    ? (value as DeadLetterStatus)
    : 'OPEN'
}

/** 주소의 ?page= (0부터) → 페이지. 0 이상 정수가 아니면 0 */
export function deadLetterPageOf(value: string | null): number {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 0
}

/** 목록 탭: 같은 칸 모듈들 + 주문 (주문은 칸 · 상태가 달라 따로 그린다) */
export type DeadLetterTab = DeadLetterModule | 'order'

/** 주소의 ?module= → 탭. 주문 또는 아는 모듈, 없거나 모르는 값은 인증 */
export function deadLetterTabOf(value: string | null): DeadLetterTab {
  return value === 'order' ? 'order' : deadLetterModuleOf(value)
}
