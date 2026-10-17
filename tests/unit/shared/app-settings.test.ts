import { afterEach, describe, expect, it } from 'vitest'
import { appSettings, env, useAppSettings } from '@/shared/config'

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
