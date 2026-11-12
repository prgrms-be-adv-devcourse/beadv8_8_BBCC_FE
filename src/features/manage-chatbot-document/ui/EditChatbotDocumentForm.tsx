import { useState, type FormEvent } from 'react'
import type { ChatbotDocument } from '@/entities/chatbot-document'
import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/StateMessage'
import {
  toChatbotDocumentForm,
  validateChatbotDocumentForm,
  type ChatbotDocumentForm,
} from '../model/chatbot-document-form'
import { useUpdateChatbotDocument } from '../model/use-manage-chatbot-document'
import { ChatbotDocumentFields } from './ChatbotDocumentFields'

type EditChatbotDocumentFormProps = { document: ChatbotDocument; onSaved?: () => void }

/** 챗봇 문서 수정: 제목 · 분류 · 본문을 모두 보내고 조각을 다시 만든다 */
export function EditChatbotDocumentForm({ document, onSaved }: EditChatbotDocumentFormProps) {
  const update = useUpdateChatbotDocument(document.id)
  const [form, setForm] = useState<ChatbotDocumentForm>(() => toChatbotDocumentForm(document))
  const [invalid, setInvalid] = useState<string | null>(null)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const message = validateChatbotDocumentForm(form)
    setInvalid(message)
    if (!message) update.mutate(form, { onSuccess: () => onSaved?.() })
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <ChatbotDocumentFields
        form={form}
        onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
      />
      <Button
        type="submit"
        className="h-11 px-6 text-[15px]"
        disabled={update.isPending}
        aria-busy={update.isPending}
      >
        {update.isPending ? '저장하는 중…' : '고친 내용 저장'}
      </Button>
      {invalid && <StateMessage tone="error">{invalid}</StateMessage>}
      {update.isError && <StateMessage tone="error">{getErrorMessage(update.error)}</StateMessage>}
    </form>
  )
}
