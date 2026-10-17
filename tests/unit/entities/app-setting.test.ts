import { describe, expect, it } from 'vitest'
import {
  needsReload,
  reloadNotice,
  toAppSetting,
  toAppSettingRequest,
  turnOffDemoConfirm,
} from '@/entities/app-setting'

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

describe('새로고침 안내 문구', () => {
  const on = { isMockEnabled: true, isDemoRoleSwitchEnabled: true }

  it('새로고침이 필요 없으면 안내하지 않는다', () => {
    expect(reloadNotice(on, on, true)).toBeNull()
  })
  it('목 데이터만 바뀌면 일반 안내를 한다', () => {
    expect(reloadNotice(on, { ...on, isMockEnabled: false }, true)).toBe(
      '바꾼 설정은 새로고침하면 이 화면에 적용돼요.',
    )
  })
  it('시연 계정으로 시연 기능을 끄면 로그아웃된다고 알린다', () => {
    expect(reloadNotice(on, { ...on, isDemoRoleSwitchEnabled: false }, true)).toBe(
      '새로고침하면 시연 기능이 꺼지고 시연 계정은 로그아웃돼요. 카카오로 로그인한 관리자만 다시 켤 수 있어요.',
    )
  })
  it('카카오 계정이면 시연 기능을 꺼도 일반 안내를 한다', () => {
    expect(reloadNotice(on, { ...on, isDemoRoleSwitchEnabled: false }, false)).toBe(
      '바꾼 설정은 새로고침하면 이 화면에 적용돼요.',
    )
  })
  it('시연 기능을 켜는 경우는 일반 안내를 한다', () => {
    const off = { ...on, isDemoRoleSwitchEnabled: false }
    expect(reloadNotice(off, on, true)).toBe('바꾼 설정은 새로고침하면 이 화면에 적용돼요.')
  })
})

describe('시연 기능 끄기 확인', () => {
  it('시연 계정이면 로그아웃되고 카카오 관리자만 다시 켤 수 있다고 경고한다', () => {
    expect(turnOffDemoConfirm(true)).toEqual({
      title: '시연 기능을 끌까요?',
      description:
        '지금은 시연 계정으로 로그인해 있어요. 새로고침하면 로그아웃되고, 카카오로 로그인한 관리자만 다시 켤 수 있어요.',
      confirmLabel: '끄기',
      tone: 'danger',
    })
  })
  it('카카오 계정이면 시연 기능이 사라진다고만 알린다', () => {
    expect(turnOffDemoConfirm(false)).toEqual({
      title: '시연 기능을 끌까요?',
      description:
        '모든 방문자에게 역할 전환 · 시연 콘솔 · API 흐름 패널이 사라지고 카카오 로그인만 남아요.',
      confirmLabel: '끄기',
      tone: 'danger',
    })
  })
})
