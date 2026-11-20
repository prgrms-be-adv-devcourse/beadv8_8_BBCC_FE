import { cn } from '@/shared/lib'
import { useChatbotOpenStore } from '../model/chatbot-open'

/** 화면 안에서 챗봇 창을 여는 버튼. 떠 있는 챗봇이 없는 영역(자녀 등)에서는 그리지 않는다 */
export function OpenChatbotButton({ className }: { className?: string }) {
  const isMounted = useChatbotOpenStore((state) => state.isMounted)
  const isOpen = useChatbotOpenStore((state) => state.isOpen)
  const setOpen = useChatbotOpenStore((state) => state.setOpen)
  if (!isMounted) return null
  return (
    <button
      type="button"
      aria-expanded={isOpen}
      onClick={() => setOpen(!isOpen)}
      className={cn(
        'bg-signal text-signal-ink flex min-h-9 shrink-0 items-center rounded-full px-3 text-[13px] font-bold',
        className,
      )}
    >
      {isOpen ? '챗봇 닫기' : '챗봇에게 묻기'}
    </button>
  )
}
