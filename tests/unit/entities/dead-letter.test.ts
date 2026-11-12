import { describe, expect, it } from 'vitest'
import {
  canReprocess,
  deadLetterModuleOf,
  deadLetterPageOf,
  deadLetterStatusOf,
  exceptionShortName,
  isDeadLetterModule,
  reprocessOutcomeOf,
  toDeadLetter,
  type DeadLetter,
} from '@/entities/dead-letter'

// BE MemberDeadLetterResponse 그대로 (null 가능 칸은 DB 컬럼이 NULL 허용인 것들)
const dto = {
  deadLetterId: '7',
  status: 'OPEN',
  sourceTopic: 'kidly.payment.events',
  sourcePartition: 2,
  sourceOffset: 41,
  dltTopic: 'kidly.payment.events.member.dlt',
  dltPartition: 0,
  dltOffset: 3,
  eventType: 'wallet.created',
  eventId: 'b0f6c1d2-0000-4000-8000-000000000007',
  messageKey: '1',
  failureType: 'java.lang.IllegalStateException',
  replayCount: 0,
  lastReplayedBy: null,
  lastReplayedAt: null,
  lastReplayFailureType: null,
  createdAt: '2026-11-06T12:00:00',
}

const deadLetter = (patch: Partial<DeadLetter> = {}): DeadLetter => ({
  ...toDeadLetter(dto),
  ...patch,
})

describe('toDeadLetter: DLT 응답 → 화면 모델', () => {
  it('모든 칸을 옮긴다 (ID는 문자열)', () => {
    expect(toDeadLetter(dto)).toEqual({
      id: '7',
      status: 'OPEN',
      sourceTopic: 'kidly.payment.events',
      sourcePartition: 2,
      sourceOffset: 41,
      dltTopic: 'kidly.payment.events.member.dlt',
      dltPartition: 0,
      dltOffset: 3,
      eventType: 'wallet.created',
      eventId: 'b0f6c1d2-0000-4000-8000-000000000007',
      messageKey: '1',
      failureType: 'java.lang.IllegalStateException',
      replayCount: 0,
      lastReplayedBy: null,
      lastReplayedAt: null,
      lastReplayFailureType: null,
      createdAt: '2026-11-06T12:00:00',
    })
  })

  it('헤더가 없던 메시지는 위치 · 이벤트 · 키 · 실패 예외가 null로 온다', () => {
    const bare = toDeadLetter({
      ...dto,
      sourcePartition: null,
      sourceOffset: null,
      eventType: null,
      eventId: null,
      messageKey: null,
      failureType: null,
    })
    expect(bare).toMatchObject({
      sourcePartition: null,
      sourceOffset: null,
      eventType: null,
      eventId: null,
      messageKey: null,
      failureType: null,
    })
  })

  it('재처리한 관리자 번호는 문자열 그대로', () => {
    expect(
      toDeadLetter({
        ...dto,
        status: 'REPROCESSED',
        replayCount: 1,
        lastReplayedBy: '9',
        lastReplayedAt: '2026-11-06T12:05:00',
      }),
    ).toMatchObject({ status: 'REPROCESSED', lastReplayedBy: '9' })
  })
})

describe('canReprocess: 처리 대기일 때만 재처리한다', () => {
  it('처리 대기', () => {
    expect(canReprocess(deadLetter())).toBe(true)
  })
  it('재처리 실패 뒤에도 처리 대기면 다시 할 수 있다', () => {
    expect(
      canReprocess(
        deadLetter({ replayCount: 1, lastReplayFailureType: 'java.lang.IllegalStateException' }),
      ),
    ).toBe(true)
  })
  it('재처리 완료는 막는다', () => {
    expect(canReprocess(deadLetter({ status: 'REPROCESSED', replayCount: 1 }))).toBe(false)
  })
})

describe('reprocessOutcomeOf: 재처리 응답(BE는 실패도 200) → 결과', () => {
  it('재처리 완료로 바뀌고 횟수가 늘면 성공', () => {
    expect(reprocessOutcomeOf(0, deadLetter({ status: 'REPROCESSED', replayCount: 1 }))).toEqual({
      kind: 'REPROCESSED',
    })
  })

  it('처리 대기로 남으면 실패, 실패 예외를 함께 준다', () => {
    expect(
      reprocessOutcomeOf(
        0,
        deadLetter({ replayCount: 1, lastReplayFailureType: 'java.lang.IllegalStateException' }),
      ),
    ).toEqual({ kind: 'FAILED', failureType: 'java.lang.IllegalStateException' })
  })

  it('두 번째 실패도 실패 (앞 실패 횟수가 있어도)', () => {
    expect(
      reprocessOutcomeOf(
        2,
        deadLetter({ replayCount: 3, lastReplayFailureType: 'java.lang.RuntimeException' }),
      ),
    ).toEqual({ kind: 'FAILED', failureType: 'java.lang.RuntimeException' })
  })

  it('이미 재처리 완료라 횟수가 그대로면 이미 처리됨 (BE는 다시 실행하지 않는다)', () => {
    expect(reprocessOutcomeOf(1, deadLetter({ status: 'REPROCESSED', replayCount: 1 }))).toEqual({
      kind: 'ALREADY_REPROCESSED',
    })
  })
})

describe('exceptionShortName: 예외 클래스 이름에서 패키지를 뗀다 (표에 넣으려고)', () => {
  it('마지막 점 뒤', () => {
    expect(
      exceptionShortName('org.springframework.kafka.support.serializer.DeserializationException'),
    ).toBe('DeserializationException')
  })
  it('패키지가 없으면 그대로', () => {
    expect(exceptionShortName('IllegalStateException')).toBe('IllegalStateException')
  })
})

describe('주소의 검색 값 → 목록 조건 (모르는 값은 기본값)', () => {
  it('모듈: 아는 키만, 없으면 인증', () => {
    expect(deadLetterModuleOf('child-profile')).toBe('child-profile')
    expect(deadLetterModuleOf('community')).toBe('community')
    expect(deadLetterModuleOf(null)).toBe('auth')
    expect(deadLetterModuleOf('payment')).toBe('auth')
    expect(deadLetterModuleOf('toString')).toBe('auth')
  })

  it('상세 주소의 모듈: 아는 키만 (모르는 키를 다른 모듈로 바꿔 읽지 않는다)', () => {
    expect(isDeadLetterModule('seller')).toBe(true)
    expect(isDeadLetterModule('payment')).toBe(false)
    expect(isDeadLetterModule('constructor')).toBe(false)
    expect(isDeadLetterModule(undefined)).toBe(false)
  })

  it('상태: OPEN · REPROCESSED만, 없으면 처리 대기', () => {
    expect(deadLetterStatusOf('REPROCESSED')).toBe('REPROCESSED')
    expect(deadLetterStatusOf(null)).toBe('OPEN')
    expect(deadLetterStatusOf('reprocessed')).toBe('OPEN')
    expect(deadLetterStatusOf('constructor')).toBe('OPEN')
  })

  it('페이지: 0 이상 정수, 아니면 0', () => {
    expect(deadLetterPageOf('2')).toBe(2)
    expect(deadLetterPageOf('0')).toBe(0)
    expect(deadLetterPageOf(null)).toBe(0)
    expect(deadLetterPageOf('-1')).toBe(0)
    expect(deadLetterPageOf('1.5')).toBe(0)
    expect(deadLetterPageOf('abc')).toBe(0)
  })
})
