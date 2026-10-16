import { afterEach, describe, expect, it } from 'vitest'
import { appSettings, env } from '@/shared/config'

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
})
