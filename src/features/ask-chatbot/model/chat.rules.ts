import type { ChatHistoryTurn, ChatMessage } from './chat'

/** BE ChatRequest: message 1~500자 */
export const CHAT_MESSAGE_MAX = 500
/** BE ChatRequest: history 최대 10개 */
export const CHAT_HISTORY_MAX = 10
/** BE ChatRequest.HistoryTurn: content 1~1000자 */
export const CHAT_HISTORY_CONTENT_MAX = 1000

export function validateChatMessage(text: string): string | null {
  if (!text.trim()) return '물어볼 내용을 입력해 주세요.'
  if (text.trim().length > CHAT_MESSAGE_MAX) return `질문은 ${CHAT_MESSAGE_MAX}자까지 쓸 수 있어요.`
  return null
}

/** 보낼 이전 대화: 빈 내용은 빼고, 긴 답은 1000자로 잘라, 오래된 것부터 최근 10개 */
export function historyOf(messages: ChatMessage[]): ChatHistoryTurn[] {
  return messages
    .filter((message) => message.content.trim() !== '')
    .slice(-CHAT_HISTORY_MAX)
    .map((message) => ({
      role: message.role,
      content: message.content.slice(0, CHAT_HISTORY_CONTENT_MAX),
    }))
}

type ChatError = {
  status: number | null
  retryAfterSeconds: number | null
  /** ProblemDetail의 detail (getErrorMessage) */
  message: string
}

/** 오류 안내. 요청 수 제한(429)은 다시 물어볼 수 있는 때를 알려 주고, 나머지는 서버 설명을 그대로 쓴다 */
export function chatErrorMessage({ status, retryAfterSeconds, message }: ChatError): string {
  if (status === 429 && retryAfterSeconds !== null) {
    return `질문이 많아 잠시 쉬어 가요. ${retryAfterSeconds}초 뒤에 다시 물어봐 주세요.`
  }
  return message
}
