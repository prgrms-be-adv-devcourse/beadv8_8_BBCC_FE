import { describe, expect, it } from 'vitest'
import { needsReload, toAppSetting, toAppSettingRequest } from '@/entities/app-setting'

describe('설정 응답 → 모델', () => {
  it('목 데이터 · 시연 역할 전환 값을 그대로 옮긴다', () => {
    expect(toAppSetting({ useMock: false, demoRoleSwitch: true })).toEqual({
      isMockEnabled: false,
      isDemoRoleSwitchEnabled: true,
    })
  })
})

describe('모델 → 설정 변경 요청', () => {
  it('두 값을 모두 보낸다', () => {
    expect(toAppSettingRequest({ isMockEnabled: true, isDemoRoleSwitchEnabled: false })).toEqual({
      useMock: true,
      demoRoleSwitch: false,
    })
  })
})

describe('새로고침이 필요한지 (지금 화면에 적용된 값 ↔ 저장된 값)', () => {
  const applied = { isMockEnabled: true, isDemoRoleSwitchEnabled: true }

  it('같으면 필요 없다', () => {
    expect(needsReload(applied, { isMockEnabled: true, isDemoRoleSwitchEnabled: true })).toBe(false)
  })
  it('목 데이터만 달라도 필요하다', () => {
    expect(needsReload(applied, { isMockEnabled: false, isDemoRoleSwitchEnabled: true })).toBe(true)
  })
  it('시연 역할 전환만 달라도 필요하다', () => {
    expect(needsReload(applied, { isMockEnabled: true, isDemoRoleSwitchEnabled: false })).toBe(true)
  })
})
