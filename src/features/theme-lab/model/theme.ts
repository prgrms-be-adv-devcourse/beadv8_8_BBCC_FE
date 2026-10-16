/** 테마 바꿔 보기: 메인(브랜드) · 강조 · 성장 색. 값은 #rrggbb */
export type Theme = { primary: string; highlight: string; growth: string }

/** E안 기본 색 (Brand Purple · Butter Yellow · Growth Green) */
export const DEFAULT_THEME: Theme = { primary: '#681078', highlight: '#f4d35e', growth: '#a9b77d' }

/** 메인 색 미리 정한 값 (다른 시안 참고) */
export const PRIMARY_PRESETS: { name: string; color: string }[] = [
  { name: '보라 (기본)', color: '#681078' },
  { name: '플럼', color: '#8e3b6b' },
  { name: '네이비', color: '#1e2a5a' },
  { name: '블루', color: '#2343d1' },
  { name: '포레스트', color: '#1f6f4a' },
  { name: '코랄', color: '#d9534a' },
  { name: '차콜', color: '#29242b' },
]

const HEX = /^#[0-9a-f]{6}$/

export const isHex = (value: string) => HEX.test(value.toLowerCase())

/** 상대 밝기 (WCAG) */
function luminance(hex: string): number {
  const channel = (i: number) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5)
}

/** 그 색 위에 올릴 글자색: 흰색과 차콜 중 대비가 큰 쪽 */
export function readableOn(hex: string): '#ffffff' | '#29242b' {
  const l = luminance(hex)
  const onWhite = 1.05 / (l + 0.05)
  const onCharcoal = (l + 0.05) / (luminance('#29242b') + 0.05)
  return onWhite >= onCharcoal ? '#ffffff' : '#29242b'
}

/** 주소에 싣는 글자: 681078.f4d35e.a9b77d */
export function serializeTheme(theme: Theme): string {
  return [theme.primary, theme.highlight, theme.growth].map((c) => c.slice(1)).join('.')
}

/** 주소 · 저장 값 → 테마. 틀린 값이면 null */
export function parseTheme(value: string | null | undefined): Theme | null {
  if (!value) return null
  const parts = value
    .toLowerCase()
    .split('.')
    .map((part) => `#${part}`)
  if (parts.length !== 3 || !parts.every(isHex)) return null
  const [primary, highlight, growth] = parts
  return { primary, highlight, growth }
}

export const isDefaultTheme = (theme: Theme) =>
  serializeTheme(theme) === serializeTheme(DEFAULT_THEME)

/** 문서에 칠할 CSS 변수 (기본값이면 비워서 index.css 값을 쓴다) */
export function themeVariables(theme: Theme): Record<string, string> {
  if (isDefaultTheme(theme)) return {}
  return {
    '--primary': theme.primary,
    '--ring': theme.primary,
    '--primary-foreground': readableOn(theme.primary),
    '--highlight': theme.highlight,
    '--highlight-foreground': readableOn(theme.highlight),
    '--growth': theme.growth,
    '--growth-foreground': readableOn(theme.growth),
  }
}
