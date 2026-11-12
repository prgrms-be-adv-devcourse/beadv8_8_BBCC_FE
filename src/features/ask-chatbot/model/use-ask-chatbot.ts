import { useMutation } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { getErrorMessage, getErrorStatus, getRetryAfterSeconds, runWithAction } from '@/shared/api'
import { askChatbotApi } from '../api/ask-chatbot-api'
import type { ChatMessage } from './chat'
import { toChatAnswer, toChatRequest } from './chat.mapper'
import { chatErrorMessage, historyOf, validateChatMessage } from './chat.rules'

/**
 * 챗봇 대화: 대화는 이 화면만 들고 있다(서버는 저장하지 않는다). 질문을 보내면 답을 받을 때까지 질문을 따로 두었다가,
 * 답이 오면 질문 · 답을 함께 쌓는다. 실패하면 질문을 입력 칸으로 돌려 history가 질문만 남지 않게 한다
 */
export function useAskChatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [invalid, setInvalid] = useState<string | null>(null)
  const nextId = useRef(0)
  const newId = () => String(++nextId.current)

  const ask = useMutation({
    mutationFn: (question: string) =>
      runWithAction('챗봇에게 묻기', () =>
        askChatbotApi.send(toChatRequest(question, historyOf(messages))),
      ).then(toChatAnswer),
    onSuccess: (answer, question) => {
      setMessages((prev) => [
        ...prev,
        { id: newId(), role: 'user', content: question.trim() },
        { id: newId(), role: 'assistant', ...answer },
      ])
    },
    onError: (_error, question) => setDraft(question),
  })

  const send = () => {
    if (ask.isPending) return
    const message = validateChatMessage(draft)
    setInvalid(message)
    if (message) return
    ask.mutate(draft)
    setDraft('')
  }

  const reset = () => {
    if (ask.isPending) return
    setMessages([])
    setInvalid(null)
    ask.reset()
  }

  const error = ask.isError
    ? chatErrorMessage({
        status: getErrorStatus(ask.error),
        retryAfterSeconds: getRetryAfterSeconds(ask.error),
        message: getErrorMessage(ask.error),
      })
    : null

  return {
    messages,
    /** 답을 기다리는 질문 */
    pendingQuestion: ask.isPending ? ask.variables.trim() : null,
    draft,
    setDraft,
    send,
    reset,
    /** 입력 검사 · 요청 오류 안내 */
    error: invalid ?? error,
  }
}
