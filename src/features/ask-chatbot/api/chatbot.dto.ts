/** POST /chatbot/messages 요청 (BE ChatRequest). history는 오래된 것부터 최대 10개 */
export type ChatRequestDto = {
  message: string
  history: ChatHistoryTurnDto[]
}

/** BE ChatRequest.HistoryTurn (content 1~1000자) */
export type ChatHistoryTurnDto = {
  role: 'USER' | 'ASSISTANT'
  content: string
}

/** BE ChatResponse.SourceResponse: 답에 쓴 근거 문서 */
export type ChatSourceDto = {
  documentId: number
  title: string
}

/** BE ChatResponse.ProductResponse: 상품 카드. 상호명 · 썸네일이 없으면 null */
export type ChatProductDto = {
  productId: number
  name: string
  businessName: string | null
  price: number
  thumbnailUrl: string | null
  soldOut: boolean
}

/** POST /chatbot/messages 응답 (BE ChatResponse). 없으면 sources · products는 [] */
export type ChatResponseDto = {
  answer: string
  sources: ChatSourceDto[]
  products: ChatProductDto[]
}
