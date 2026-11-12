import { describe, expect, it } from 'vitest'
import type { ApiCallLog } from '@/shared/api'
import { domainOf } from '@/widgets/api-flow-panel/config/domain-flow'
import { deriveStateChanges } from '@/widgets/api-flow-panel/model/state-changes'

let id = 0
const log = (patch: Partial<ApiCallLog>): ApiCallLog => ({
  id: ++id,
  action: null,
  actor: null,
  method: 'GET',
  path: '/',
  status: 200,
  durationMs: 10,
  startedAt: `2026-11-06T12:00:0${id % 10}.000Z`,
  requestBody: null,
  responseBody: null,
  contractIssues: [],
  ...patch,
})
const deadLetter = (status: string) => ({ deadLetterId: '7', status, replayCount: 1 })

describe('처리 실패 메시지 API 흐름 표시', () => {
  it('네 모듈의 처리 실패 메시지 API는 회원 도메인이다', () => {
    for (const module of ['auth', 'member', 'seller', 'child-profile']) {
      expect(domainOf(`/admin/${module}-dead-letters?status=OPEN&page=0&size=20`)).toBe('member')
      expect(domainOf(`/admin/${module}-dead-letters/7/reprocess`)).toBe('member')
    }
  })

  it('상태 변화: 상세에서 본 처리 대기 → 재처리 응답의 재처리 완료', () => {
    const changes = deriveStateChanges([
      log({ path: '/admin/seller-dead-letters/7', responseBody: deadLetter('OPEN') }),
      log({
        method: 'POST',
        path: '/admin/seller-dead-letters/7/reprocess',
        responseBody: deadLetter('REPROCESSED'),
      }),
    ])
    expect(changes.map((change) => `${change.resource}: ${change.from} → ${change.to}`)).toEqual([
      '판매자 처리 실패 메시지 #7: null → OPEN',
      '판매자 처리 실패 메시지 #7: OPEN → REPROCESSED',
    ])
  })

  it('모듈이 다르면 번호가 같아도 다른 메시지다', () => {
    const changes = deriveStateChanges([
      log({ path: '/admin/auth-dead-letters/7', responseBody: deadLetter('OPEN') }),
      log({ path: '/admin/child-profile-dead-letters/7', responseBody: deadLetter('REPROCESSED') }),
    ])
    expect(changes.map((change) => change.resource)).toEqual([
      '인증 처리 실패 메시지 #7',
      '자녀 프로필 처리 실패 메시지 #7',
    ])
  })

  it('목록 응답의 행마다 상태를 본다', () => {
    const changes = deriveStateChanges([
      log({
        path: '/admin/member-dead-letters',
        responseBody: { content: [deadLetter('OPEN')], page: 0, totalPages: 1 },
      }),
    ])
    expect(changes.map((change) => `${change.resource}: ${change.to}`)).toEqual([
      '회원 처리 실패 메시지 #7: OPEN',
    ])
  })
})
