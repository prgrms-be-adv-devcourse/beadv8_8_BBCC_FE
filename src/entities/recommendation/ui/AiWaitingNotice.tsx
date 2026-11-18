import { cn } from '@/shared/lib'

const DOTS = [0, 1, 2]
/** 점이 하나씩 뛰는 간격 */
const DOT_STEP_MS = 160

type AiWaitingNoticeProps = {
  /** 무엇을 기다리는지 (화면 읽기 프로그램도 이 문구를 읽는다) */
  message: string
  /** 칸 안에 홀로 둘 때: 점 사이 3px · 점과 문구 사이 8px (기본은 제목 옆에 붙는 좁은 간격) */
  isSpacious?: boolean
  className?: string
}

/**
 * AI 답을 기다리는 동안의 표시: 뛰는 점 셋 + 문구. 제목 옆에 두거나(기본), 칸 안에 홀로 둔다(isSpacious).
 * 동작 줄이기 설정이면 점이 움직이지 않는다
 */
export function AiWaitingNotice({ message, isSpacious = false, className }: AiWaitingNoticeProps) {
  return (
    <span
      role="status"
      aria-label={message}
      className={cn(
        'text-primary inline-flex items-center text-[13px] font-semibold',
        isSpacious ? 'gap-2' : 'gap-1.5',
        className,
      )}
    >
      <span aria-hidden className={cn('flex items-center', isSpacious ? 'gap-[3px]' : 'gap-0.5')}>
        {DOTS.map((index) => (
          <span
            key={index}
            className="bg-primary size-1.5 animate-bounce rounded-full motion-reduce:animate-none"
            style={{ animationDelay: `${index * DOT_STEP_MS}ms` }}
          />
        ))}
      </span>
      {message}
    </span>
  )
}
