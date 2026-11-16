import {
  CHATBOT_DOCUMENT_CATEGORIES,
  CHATBOT_DOCUMENT_CATEGORY_LABEL,
} from '@/entities/chatbot-document'
import { Input, Select, Textarea } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import {
  CHATBOT_DOCUMENT_CONTENT_MAX,
  CHATBOT_DOCUMENT_TITLE_MAX,
  type ChatbotDocumentForm,
} from '../model/chatbot-document-form'

type ChatbotDocumentFieldsProps = {
  form: ChatbotDocumentForm
  onChange: (patch: Partial<ChatbotDocumentForm>) => void
}

/** 제목 · 분류 · 본문 (저장 · 수정 같이 쓴다) */
export function ChatbotDocumentFields({ form, onChange }: ChatbotDocumentFieldsProps) {
  return (
    <div className="grid gap-4">
      <Label>
        제목
        <Input
          className="h-10"
          maxLength={CHATBOT_DOCUMENT_TITLE_MAX}
          value={form.title}
          onChange={(e) => onChange({ title: e.target.value })}
        />
      </Label>
      <Label>
        분류
        <Select
          className="h-10 w-48"
          value={form.category}
          onChange={(e) =>
            onChange({ category: e.target.value as ChatbotDocumentForm['category'] })
          }
        >
          {CHATBOT_DOCUMENT_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {CHATBOT_DOCUMENT_CATEGORY_LABEL[category]}
            </option>
          ))}
        </Select>
      </Label>
      <Label>
        본문
        <Textarea
          className="min-h-72"
          maxLength={CHATBOT_DOCUMENT_CONTENT_MAX}
          value={form.content}
          onChange={(e) => onChange({ content: e.target.value })}
        />
        <span className="figure text-ink-3 text-[12px] font-normal">
          {form.content.length.toLocaleString('ko-KR')}/
          {CHATBOT_DOCUMENT_CONTENT_MAX.toLocaleString('ko-KR')}자 · 문단(빈 줄)으로 나눠 쓰면
          챗봇이 더 잘 찾아요
        </span>
      </Label>
    </div>
  )
}
