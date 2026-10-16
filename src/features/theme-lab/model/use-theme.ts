import { useEffect } from 'react'
import { create } from 'zustand'
import { DEFAULT_THEME, parseTheme, serializeTheme, themeVariables, type Theme } from './theme'

const STORAGE_KEY = 'kidly.theme'
const HIDDEN_KEY = 'kidly.theme.hidden'

function read(key: string, storage: () => Storage): string | null {
  try {
    return storage().getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string | null, storage: () => Storage) {
  try {
    if (value === null) storage().removeItem(key)
    else storage().setItem(key, value)
  } catch {
    // 저장할 수 없으면 이 탭에서만 쓴다
  }
}

/** 주소의 ?theme= (링크로 받은 색 · off면 버튼 숨김)을 저장 값보다 먼저 본다 */
function initial(): { theme: Theme; hidden: boolean } {
  if (typeof window === 'undefined') return { theme: DEFAULT_THEME, hidden: false }
  const param = new URLSearchParams(window.location.search).get('theme')
  if (param === 'off') write(HIDDEN_KEY, '1', () => sessionStorage)
  if (param === 'on') write(HIDDEN_KEY, null, () => sessionStorage)
  const fromUrl = parseTheme(param)
  if (fromUrl) write(STORAGE_KEY, serializeTheme(fromUrl), () => localStorage)
  return {
    theme: fromUrl ?? parseTheme(read(STORAGE_KEY, () => localStorage)) ?? DEFAULT_THEME,
    hidden: read(HIDDEN_KEY, () => sessionStorage) === '1',
  }
}

type ThemeState = {
  theme: Theme
  hidden: boolean
  set: (patch: Partial<Theme>) => void
  reset: () => void
}

/** 각자 브라우저에만 저장 (다른 사람 화면은 바뀌지 않음) */
export const useThemeStore = create<ThemeState>((setState, get) => ({
  ...initial(),
  set: (patch) => {
    const theme = { ...get().theme, ...patch }
    write(STORAGE_KEY, serializeTheme(theme), () => localStorage)
    setState({ theme })
  },
  reset: () => {
    write(STORAGE_KEY, null, () => localStorage)
    setState({ theme: DEFAULT_THEME })
  },
}))

/** 앱 전체에 테마 CSS 변수를 칠한다 (판매자 센터 · 관리자는 영역 색이 따로 있어 그대로) */
export function useApplyTheme() {
  const theme = useThemeStore((state) => state.theme)
  useEffect(() => {
    const root = document.documentElement
    const variables = themeVariables(theme)
    const names = [
      '--primary',
      '--ring',
      '--primary-foreground',
      '--highlight',
      '--highlight-foreground',
      '--growth',
      '--growth-foreground',
    ]
    for (const name of names) root.style.removeProperty(name)
    for (const [name, value] of Object.entries(variables)) root.style.setProperty(name, value)
  }, [theme])
}
