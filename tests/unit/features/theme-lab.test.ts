import { describe, expect, it } from 'vitest'
import {
  DEFAULT_THEME,
  parseTheme,
  readableOn,
  serializeTheme,
  themeVariables,
} from '@/features/theme-lab'

describe('테마 바꿔 보기', () => {
  it('주소 글자로 주고받는다 (681078.f4d35e.a9b77d)', () => {
    const value = serializeTheme(DEFAULT_THEME)
    expect(value).toBe('681078.f4d35e.a9b77d')
    expect(parseTheme(value)).toEqual(DEFAULT_THEME)
    expect(parseTheme('2343D1.F4D35E.A9B77D')?.primary).toBe('#2343d1')
  })
  it('틀린 값은 버린다', () => {
    expect(parseTheme(null)).toBeNull()
    expect(parseTheme('off')).toBeNull()
    expect(parseTheme('zzzzzz.f4d35e.a9b77d')).toBeNull()
    expect(parseTheme('681078.f4d35e')).toBeNull()
  })
  it('글자색은 대비가 큰 쪽 (진한 색 → 흰 글자, 밝은 색 → 차콜)', () => {
    expect(readableOn('#681078')).toBe('#ffffff')
    expect(readableOn('#f4d35e')).toBe('#29242b')
    expect(readableOn('#ffffff')).toBe('#29242b')
  })
  it('기본값이면 CSS 변수를 덮지 않고, 바꾸면 메인 · 테두리 · 글자색을 함께 바꾼다', () => {
    expect(themeVariables(DEFAULT_THEME)).toEqual({})
    const variables = themeVariables({ ...DEFAULT_THEME, primary: '#f4d35e' })
    expect(variables['--primary']).toBe('#f4d35e')
    expect(variables['--ring']).toBe('#f4d35e')
    expect(variables['--primary-foreground']).toBe('#29242b')
  })
})
