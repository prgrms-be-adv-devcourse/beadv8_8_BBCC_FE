import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Link } from 'react-router'
import { cn } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { Textarea } from '@/shared/ui/input'
import type { ChatMessage } from '../model/chat'
import { CHAT_MESSAGE_MAX } from '../model/chat.rules'
import { useAskChatbot } from '../model/use-ask-chatbot'
import { ChatProductCard } from './ChatProductCard'

/** 처음 열었을 때 눌러 볼 수 있는 질문 (상품 찾기 · 내 주문 · 이용 안내) */
const EXAMPLES = [
  '3만원 이하 여아 원피스 추천해 줘',
  '내 주문 어디쯤 왔어?',
  '교환 · 반품은 어떻게 해요?',
]

type ChatbotWidgetProps = {
  /** 회원 로그인이 됐는지 (챗봇은 회원 API) */
  isSignedIn: boolean
  /** 새로고침 뒤 로그인을 되살리는 중 */
  isRestoring: boolean
  loginHref: string
  productHref: (productId: string) => string
  /** 화면 아래에 고정 바가 있는 화면(상품 상세)에서 버튼을 올린다 */
  raised?: boolean
}

/** 떠 있는 챗봇 버튼 + 대화 창. 닫아도 대화는 남는다 (로그인한 회원이 바뀌면 화면이 새로 만든다) */
export function ChatbotWidget({
  isSignedIn,
  isRestoring,
  loginHref,
  productHref,
  raised,
}: ChatbotWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  // 대화는 창 밖에 둔다: 닫았다 열어도, 답을 기다리는 중에 닫아도 이어진다
  const chat = useAskChatbot()

  return (
    <div
      className={cn(
        'fixed bottom-4 left-4 z-40 flex flex-col items-start gap-2',
        raised && 'max-md:bottom-40',
      )}
    >
      {isOpen && (
        <section
          aria-label="챗봇 상담"
          className="border-rule flex h-[min(36rem,calc(100svh-7rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border bg-white shadow-xl"
        >
          <header className="border-rule flex items-center justify-between border-b px-4 py-3">
            <div>
              <h2 className="text-[15px] font-bold">Kidly 챗봇</h2>
              <p className="text-ink-3 text-[12px]">상품 찾기 · 내 주문 · 이용 안내를 물어보세요</p>
            </div>
            <button
              type="button"
              aria-label="대화 창 닫기"
              onClick={() => setIsOpen(false)}
              className="text-ink-3 hover:text-ink flex size-9 items-center justify-center rounded-full"
            >
              ✕
            </button>
          </header>
          {isSignedIn ? (
            <Conversation chat={chat} productHref={productHref} onLeave={() => setIsOpen(false)} />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center text-sm">
              {isRestoring ? (
                <p className="text-ink-3">로그인 확인 중…</p>
              ) : (
                <>
                  <p className="text-ink-2">
                    로그인하면 상품 추천 · 주문 배송 상황 · 이용 안내를 물어볼 수 있어요.
                  </p>
                  <Link
                    to={loginHref}
                    onClick={() => setIsOpen(false)}
                    className="shop-btn min-h-10 px-4"
                  >
                    로그인하기
                  </Link>
                </>
              )}
            </div>
          )}
        </section>
      )}
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className="bg-signal text-signal-ink flex min-h-11 items-center gap-1.5 rounded-full px-4 text-sm font-bold shadow-lg"
      >
        {isOpen ? '챗봇 닫기' : '챗봇에게 묻기'}
      </button>
    </div>
  )
}

type ConversationProps = {
  chat: ReturnType<typeof useAskChatbot>
  productHref: (productId: string) => string
  /** 상품 카드를 눌러 다른 화면으로 갈 때 (창을 닫는다) */
  onLeave: () => void
}

function Conversation({ chat, productHref, onLeave }: ConversationProps) {
  const endRef = useRef<HTMLDivElement>(null)
  const isPending = chat.pendingQuestion !== null

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [chat.messages.length, isPending])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    chat.send()
  }

  // Enter는 보내기, Shift+Enter는 줄바꿈. 한글 조합 중 Enter는 글자를 끝내는 것이라 보내지 않는다
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      chat.send()
    }
  }

  return (
    <>
      <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
        {chat.messages.length === 0 && !isPending && (
          <div className="space-y-2">
            <p className="text-ink-2 text-sm">이렇게 물어볼 수 있어요.</p>
            <ul className="flex flex-wrap gap-2">
              {EXAMPLES.map((example) => (
                <li key={example}>
                  <button
                    type="button"
                    onClick={() => chat.setDraft(example)}
                    className="border-rule hover:border-signal rounded-full border px-3 py-1.5 text-[13px]"
                  >
                    {example}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {chat.messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            productHref={productHref}
            onLeave={onLeave}
          />
        ))}
        {chat.pendingQuestion !== null && (
          <>
            <UserBubble content={chat.pendingQuestion} />
            <p role="status" className="text-ink-3 text-[13px]">
              답을 찾고 있어요… 상품 · 주문을 확인하면 몇 초 걸릴 수 있어요.
            </p>
          </>
        )}
        <div ref={endRef} />
      </div>
      <form onSubmit={handleSubmit} className="border-rule space-y-2 border-t p-3">
        {chat.error && (
          <p role="alert" className="text-destructive text-[13px]">
            {chat.error}
          </p>
        )}
        <Textarea
          aria-label="챗봇에게 물어볼 내용"
          placeholder="궁금한 것을 물어보세요"
          rows={2}
          maxLength={CHAT_MESSAGE_MAX}
          value={chat.draft}
          disabled={isPending}
          onChange={(event) => chat.setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          className="resize-none"
        />
        <div className="flex items-center gap-2">
          <span className="figure text-ink-3 text-[12px]">
            {chat.draft.length}/{CHAT_MESSAGE_MAX}
          </span>
          {chat.messages.length > 0 && (
            <button
              type="button"
              onClick={chat.reset}
              disabled={isPending}
              className="text-ink-3 hover:text-ink text-[12px] font-semibold disabled:opacity-50"
            >
              새 대화
            </button>
          )}
          <Button
            type="submit"
            className="ml-auto h-9 px-4"
            disabled={isPending}
            aria-busy={isPending}
          >
            {isPending ? '답 기다리는 중' : '보내기'}
          </Button>
        </div>
      </form>
    </>
  )
}

type UserBubbleProps = { content: string }

function UserBubble({ content }: UserBubbleProps) {
  return (
    <p className="bg-signal-soft text-ink ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm px-3 py-2 text-sm whitespace-pre-wrap">
      {content}
    </p>
  )
}

type MessageItemProps = {
  message: ChatMessage
  productHref: (productId: string) => string
  onLeave: () => void
}

function MessageItem({ message, productHref, onLeave }: MessageItemProps) {
  if (message.role === 'user') return <UserBubble content={message.content} />
  return (
    <div className="space-y-2">
      <p className="bg-paper-2 text-ink w-fit max-w-[90%] rounded-2xl rounded-bl-sm px-3 py-2 text-sm whitespace-pre-wrap">
        {message.content}
      </p>
      {message.products.length > 0 && (
        <ul aria-label="찾은 상품" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {message.products.map((product) => (
            <li key={product.id}>
              <ChatProductCard product={product} href={productHref(product.id)} onOpen={onLeave} />
            </li>
          ))}
        </ul>
      )}
      {message.sources.length > 0 && (
        <p className="text-ink-3 text-[12px]">
          참고한 안내: {message.sources.map((source) => source.title).join(' · ')}
        </p>
      )}
    </div>
  )
}
