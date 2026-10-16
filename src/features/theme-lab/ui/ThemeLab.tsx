import { useState } from 'react'
import { cn } from '@/shared/lib'
import { isDefaultTheme, PRIMARY_PRESETS, serializeTheme, type Theme } from '../model/theme'
import { useThemeStore } from '../model/use-theme'

const FIELDS: { key: keyof Theme; label: string; hint: string }[] = [
  { key: 'primary', label: '메인', hint: '로고 · 버튼 · 선택' },
  { key: 'highlight', label: '강조', hint: '추천 · 배지' },
  { key: 'growth', label: '성장', hint: '자녀 · 성장 기록만' },
]

/** 화면 오른쪽 아래: 메인 색을 바꿔 보며 비교 (주소에 ?theme=off면 숨김) */
export function ThemeLab() {
  const { theme, hidden, set, reset } = useThemeStore()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  if (hidden) return null

  const copyLink = async () => {
    const url = new URL(window.location.href)
    url.searchParams.set('theme', serializeTheme(theme))
    try {
      await navigator.clipboard.writeText(url.toString())
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      window.prompt('이 링크를 복사하세요', url.toString())
    }
  }

  return (
    <div className="fixed right-4 bottom-4 z-40 flex flex-col items-end gap-2">
      {open && (
        <section
          aria-label="테마 바꿔 보기"
          className="w-72 space-y-4 rounded-2xl border bg-white p-4 text-sm shadow-xl"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-bold">테마 바꿔 보기</h2>
            <span className="text-muted-foreground text-xs">내 브라우저에만 저장</span>
          </div>
          <div className="space-y-2">
            <p className="text-muted-foreground text-xs">메인 색</p>
            <div className="flex flex-wrap gap-2">
              {PRIMARY_PRESETS.map((preset) => (
                <button
                  key={preset.color}
                  type="button"
                  title={preset.name}
                  aria-label={preset.name}
                  aria-pressed={theme.primary === preset.color}
                  onClick={() => set({ primary: preset.color })}
                  className={cn(
                    'size-8 rounded-full border-2 border-white shadow ring-2 ring-transparent',
                    theme.primary === preset.color && 'ring-foreground',
                  )}
                  style={{ backgroundColor: preset.color }}
                />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {FIELDS.map((field) => (
              <label key={field.key} className="flex items-center gap-3">
                <input
                  type="color"
                  aria-label={`${field.label} 색 직접 고르기`}
                  value={theme[field.key]}
                  onChange={(e) => set({ [field.key]: e.target.value })}
                  className="size-8 cursor-pointer rounded border-0 bg-transparent p-0"
                />
                <span className="flex-1">
                  <span className="font-medium">{field.label}</span>{' '}
                  <span className="text-muted-foreground text-xs">{field.hint}</span>
                </span>
                <code className="text-muted-foreground text-xs">{theme[field.key]}</code>
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={copyLink}
              className="bg-primary text-primary-foreground flex-1 rounded-full px-3 py-2 text-xs font-semibold"
            >
              {copied ? '복사했어요' : '이 색으로 링크 복사'}
            </button>
            <button
              type="button"
              onClick={reset}
              disabled={isDefaultTheme(theme)}
              className="rounded-full border px-3 py-2 text-xs disabled:opacity-40"
            >
              기본값
            </button>
          </div>
        </section>
      )}
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-full border bg-white px-3 py-2 text-xs font-semibold shadow-lg"
      >
        <span className="flex -space-x-1">
          <span className="bg-primary size-4 rounded-full border-2 border-white" />
          <span className="bg-highlight size-4 rounded-full border-2 border-white" />
          <span className="bg-growth size-4 rounded-full border-2 border-white" />
        </span>
        테마
      </button>
    </div>
  )
}
