import { useEffect, useId, useRef, useState, type ReactNode } from 'react'

type InfoTipProps = {
  /** 아이콘 버튼 이름 (화면 읽기용) */
  label: string
  /** 안내 창 내용 */
  children: ReactNode
}

/**
 * 문장 옆 작은 안내 아이콘(ⓘ). 마우스를 올리거나 초점을 두거나 누르면 안내 창을 연다(휴대폰은 눌러서).
 * 마우스가 나가거나 초점이 빠지거나 바깥을 누르거나 Esc면 닫는다. 의존성 없이 버튼 + 상태 + aria-expanded로 만든다
 */
export function InfoTip({ label, children }: InfoTipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const tipId = useId()
  const rootRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <span
      ref={rootRef}
      className="relative inline-flex align-middle"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        aria-label={label}
        aria-expanded={isOpen}
        aria-controls={tipId}
        onClick={() => setIsOpen(true)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        className="text-ink-3 hover:text-ink inline-flex size-6 items-center justify-center rounded-full"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5M12 8h.01" />
        </svg>
      </button>
      {isOpen && (
        <span
          id={tipId}
          role="note"
          className="bg-paper border-rule text-ink-2 absolute top-full right-0 z-20 mt-1 w-64 max-w-[calc(100vw-2rem)] space-y-1 rounded-md border p-2.5 text-xs leading-snug shadow-md"
        >
          {children}
        </span>
      )}
    </span>
  )
}
