import { useState, type FormEvent } from 'react'
import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/StateMessage'
import {
  EMPTY_CHATBOT_DOCUMENT_FORM,
  validateChatbotDocumentForm,
  type ChatbotDocumentForm,
} from '../model/chatbot-document-form'
import { useCreateChatbotDocument } from '../model/use-manage-chatbot-document'
import { ChatbotDocumentFields } from './ChatbotDocumentFields'

type CreateChatbotDocumentFormProps = { onCreated?: (documentId: string) => void }

/** 챗봇 문서 저장: 저장하면 본문을 조각내 임베딩한다 (몇 초 걸릴 수 있다) */
export function CreateChatbotDocumentForm({ onCreated }: CreateChatbotDocumentFormProps) {
  const create = useCreateChatbotDocument()
  const [form, setForm] = useState<ChatbotDocumentForm>(EMPTY_CHATBOT_DOCUMENT_FORM)
  const [invalid, setInvalid] = useState<string | null>(null)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const message = validateChatbotDocumentForm(form)
    setInvalid(message)
    if (!message) create.mutate(form, { onSuccess: (document) => onCreated?.(document.id) })
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
        disabled={create.isPending}
        aria-busy={create.isPending}
      >
        {create.isPending ? '저장하는 중…' : '문서 저장'}
      </Button>
      {invalid && <StateMessage tone="error">{invalid}</StateMessage>}
      {create.isError && <StateMessage tone="error">{getErrorMessage(create.error)}</StateMessage>}
    </form>
  )
}
