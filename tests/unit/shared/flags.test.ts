import { describe, expect, it } from 'vitest'
import { demoToolsOn, flagOn } from '@/shared/config'

describe('flagOn: 빌드 값 문자열을 켜짐 · 꺼짐으로 읽는다 (false만 끔)', () => {
  it.each([
    ['false', false],
    ['true', true],
    ['', true],
    [undefined, true],
  ] as const)('%s → %s', (value, on) => {
    expect(flagOn(value)).toBe(on)
  })
})

describe('demoToolsOn: VITE_DEMO_TOOLS가 없으면 시연 역할 전환을 따른다', () => {
  it.each([
    [undefined, true, true],
    [undefined, false, false],
    ['', false, false],
    ['true', false, true],
    ['false', true, false],
  ] as const)('VITE_DEMO_TOOLS=%s, 역할 전환=%s → %s', (value, roleSwitch, on) => {
    expect(demoToolsOn(value, roleSwitch)).toBe(on)
  })
})
