import { toImageUrl } from '@/shared/lib'
import type { ChatRequestDto, ChatResponseDto } from '../api/chatbot.dto'
import type { ChatAnswer, ChatHistoryTurn } from './chat'

const ROLE_DTO = { user: 'USER', assistant: 'ASSISTANT' } as const

export function toChatRequest(message: string, history: ChatHistoryTurn[]): ChatRequestDto {
  return {
    message: message.trim(),
    history: history.map((turn) => ({ role: ROLE_DTO[turn.role], content: turn.content })),
  }
}

export function toChatAnswer(dto: ChatResponseDto): ChatAnswer {
  return {
    content: dto.answer,
    sources: dto.sources.map((source) => ({
      documentId: String(source.documentId),
      title: source.title,
    })),
    products: dto.products.map((product) => ({
      id: String(product.productId),
      name: product.name,
      sellerName: product.businessName,
      price: product.price,
      thumbnailUrl: toImageUrl(product.thumbnailUrl),
      isSoldOut: product.soldOut,
    })),
  }
}
