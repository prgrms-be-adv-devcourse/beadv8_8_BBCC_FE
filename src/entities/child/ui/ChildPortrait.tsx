import { cn } from '@/shared/lib'

type ChildPortraitProps = { className?: string }

/** 선으로만 그린 아이 얼굴 낙서. 꾸밈이라 화면 읽기에서는 건너뛴다 */
export function ChildPortrait({ className }: ChildPortraitProps) {
  return (
    <svg
      viewBox="18 18 84 98"
      className={cn('text-ink', className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M30 62 Q28 26 60 24 Q92 26 90 62" />
      <path d="M32 58 Q34 96 60 98 Q86 96 88 58" />
      <path d="M34 50 Q48 34 62 46 Q74 34 86 50" />
      <path d="M30 62 Q22 62 24 72 Q26 78 33 76 M90 62 Q98 62 96 72 Q94 78 87 76" />
      <path d="M46 66 v5 M74 66 v5 M52 82 Q60 89 68 82 M58 72 Q60 76 62 72" />
      <path d="M48 98 Q46 108 34 112 M72 98 Q74 108 86 112" />
    </svg>
  )
}
