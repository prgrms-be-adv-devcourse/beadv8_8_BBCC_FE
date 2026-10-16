import { describe, expect, it } from 'vitest'
import { needsReload, toAppSetting, toAppSettingRequest } from '@/entities/app-setting'

describe('설정 응답 → 모델', () => {
  it('목 데이터 사용 여부를 옮긴다', () => {
    expect(toAppSetting({ useMock: false })).toEqual({ isMockEnabled: false })
  })
})

describe('모델 → 설정 변경 요청', () => {
  it('목 데이터 사용 여부를 보낸다', () => {
    expect(toAppSettingRequest({ isMockEnabled: true })).toEqual({ useMock: true })
  })
})

describe('새로고침이 필요한지 (지금 화면에 적용된 값 ↔ 저장된 값)', () => {
  it('같으면 필요 없다', () => {
    expect(needsReload({ isMockEnabled: true }, { isMockEnabled: true })).toBe(false)
  })
  it('다르면 필요하다', () => {
    expect(needsReload({ isMockEnabled: true }, { isMockEnabled: false })).toBe(true)
  })
})
