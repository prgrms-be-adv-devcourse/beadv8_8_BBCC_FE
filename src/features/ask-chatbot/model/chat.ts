/** 답 아래에 보이는 근거 문서 (관리자가 등록한 FAQ · 정책 · 사이즈 안내) */
export type ChatSource = {
  documentId: string
  title: string
}

/** 답 아래 상품 카드 */
export type ChatProduct = {
  id: string
  name: string
  /** 판매자 상호명. 없으면 null */
  sellerName: string | null
  price: number
  thumbnailUrl: string | null
  isSoldOut: boolean
}

/** 챗봇의 답 하나 */
export type ChatAnswer = {
  content: string
  sources: ChatSource[]
  products: ChatProduct[]
}

/** 화면에 쌓이는 대화 한 줄 (서버는 대화를 저장하지 않는다) */
export type ChatMessage =
  { id: string; role: 'user'; content: string } | ({ id: string; role: 'assistant' } & ChatAnswer)

/** 서버에 보내는 이전 대화 한 줄 */
export type ChatHistoryTurn = {
  role: ChatMessage['role']
  content: string
}
