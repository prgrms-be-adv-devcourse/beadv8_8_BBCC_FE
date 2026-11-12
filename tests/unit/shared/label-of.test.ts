import { describe, expect, it } from 'vitest'
import { labelOf } from '@/shared/lib'

const TABLE = { READY: '발송 준비' } as const

describe('labelOf: 표에 없는 값은 빈칸 대신 원래 코드', () => {
  it('표에 있으면 라벨', () => {
    expect(labelOf(TABLE, 'READY')).toBe('발송 준비')
  })
  it('표에 없으면 받은 코드 그대로', () => {
    expect(labelOf(TABLE, 'RETURNED')).toBe('RETURNED')
  })
  it('null · undefined · 빈 값이면 빈 문자열', () => {
    expect(labelOf(TABLE, null)).toBe('')
    expect(labelOf(TABLE, undefined)).toBe('')
    expect(labelOf(TABLE, '')).toBe('')
  })
  it('Object 기본 속성 이름은 라벨로 읽지 않는다', () => {
    expect(labelOf(TABLE, 'toString')).toBe('toString')
  })
})
