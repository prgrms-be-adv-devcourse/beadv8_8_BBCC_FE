import { cn } from '@/shared/lib'

const DOTS = [0, 1, 2]
/** 점이 하나씩 뛰는 간격 */
const DOT_STEP_MS = 160

type AiWaitingNoticeProps = {
  /** 무엇을 기다리는지 (화면 읽기 프로그램도 이 문구를 읽는다) */
  message: string
  className?: string
}

/**
 * 규칙 결과를 먼저 그린 뒤 AI 답을 기다리는 동안 제목 옆에 두는 표시: 뛰는 점 셋 + 문구.
 * 동작 줄이기 설정이면 점이 움직이지 않는다
 */
export function AiWaitingNotice({ message, className }: AiWaitingNoticeProps) {
  return (
    <span
      role="status"
      aria-label={message}
      className={cn(
        'text-primary inline-flex items-center gap-1.5 text-[13px] font-semibold',
        className,
      )}
    >
      <span aria-hidden className="flex items-center gap-0.5">
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
