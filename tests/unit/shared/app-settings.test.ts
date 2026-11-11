import { afterEach, describe, expect, it } from 'vitest'
import { appSettings, env, resolveMockEnabled, useAppSettings } from '@/shared/config'

describe('실행 중 설정 (앱 시작 때 BE 설정을 적용)', () => {
  const initial = appSettings.current()

  afterEach(() => appSettings.apply(initial))

  it('적용하기 전에는 빌드 값(없으면 켬)을 쓴다', () => {
    expect(initial).toEqual({ isMockEnabled: true, isDemoRoleSwitchEnabled: true })
  })
  it('적용하면 시연 역할 전환 여부(env.demoRoleSwitch)도 그 값을 따른다', () => {
    appSettings.apply({ isMockEnabled: false, isDemoRoleSwitchEnabled: false })

    expect(appSettings.current()).toEqual({ isMockEnabled: false, isDemoRoleSwitchEnabled: false })
    expect(env.demoRoleSwitch).toBe(false)
  })
  it('적용하면 구독한 화면에 바뀐 값을 알린다 (새로고침 없이 다시 그린다)', () => {
    const seen: boolean[] = []
    const unsubscribe = useAppSettings.subscribe((state) =>
      seen.push(state.isDemoRoleSwitchEnabled),
    )

    appSettings.apply({ isMockEnabled: true, isDemoRoleSwitchEnabled: false })
    unsubscribe()

    expect(seen).toEqual([false])
  })
})

describe('시연 데이터(목) 사용 여부: 관리자 설정에서 고른 값이 빌드 값보다 앞선다', () => {
  it('고른 적이 없으면 빌드 값을 따른다 (없으면 켬)', () => {
    expect(resolveMockEnabled(undefined, null)).toBe(true)
    expect(resolveMockEnabled('true', null)).toBe(true)
    expect(resolveMockEnabled('false', null)).toBe(false)
  })
  it('켬 · 끔을 고른 적이 있으면 빌드 값과 상관없이 그 값을 쓴다', () => {
    expect(resolveMockEnabled('false', 'on')).toBe(true)
    expect(resolveMockEnabled(undefined, 'off')).toBe(false)
  })
  it('알 수 없는 저장 값은 무시하고 빌드 값을 쓴다', () => {
    expect(resolveMockEnabled('false', 'yes')).toBe(false)
  })
})
