import { apiClient, expectShape } from '@/shared/api'
import type { ChatRequestDto, ChatResponseDto } from './chatbot.dto'
import { chatResponseShape } from './chatbot.shape'

/** AI가 상품 검색 · 주문 조회 도구를 여러 번 부르면 수십 초 걸릴 수 있다 (Gateway 응답 제한 55초보다 조금 길게) */
const CHAT_TIMEOUT_MS = 60_000

/** 챗봇에게 묻기 (BE ChatController). 대화는 서버에 저장되지 않아 화면이 history를 보낸다 */
export const askChatbotApi = {
  /** 200. 오류: 400 입력 검사, 401, 429 요청 수 제한(Retry-After), 503 AI를 쓸 수 없음 */
  send: (request: ChatRequestDto) =>
    apiClient
      .post<ChatResponseDto>('/chatbot/messages', request, { timeout: CHAT_TIMEOUT_MS })
      .then(expectShape(chatResponseShape)),
}
