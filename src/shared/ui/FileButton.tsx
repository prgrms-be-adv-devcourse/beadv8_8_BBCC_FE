import type { ChangeEvent, ReactNode } from 'react'
import { cn } from '@/shared/lib'
import { Button } from './button'
import { Label } from './label'

type FileButtonProps = {
  /** 칸 이름. 파일 칸의 접근 이름이 된다 */
  title: string
  /** 칸 이름 옆 괄호 안내 (형식 · 장수) */
  hint?: string
  accept?: string
  multiple?: boolean
  disabled?: boolean
  /** 버튼 글자 */
  buttonText?: string
  /** 버튼 옆 상태 (예: 2/5장 올림) */
  status?: ReactNode
  className?: string
  onSelect: (files: File[]) => void
}

/**
 * 파일 고르기: 브라우저 기본 파일 칸(영어 「Choose File」) 대신 영역 버튼 모양과 한국어 상태를 보인다.
 * 실제 파일 칸은 화면에서만 숨겨 키보드 · 화면 읽기 프로그램 · 테스트가 그대로 쓴다
 */
export function FileButton({
  title,
  hint,
  accept,
  multiple,
  disabled,
  buttonText = '사진 고르기',
  status,
  className,
  onSelect,
}: FileButtonProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onSelect(Array.from(event.target.files ?? []))
    // 같은 파일을 다시 골라도 change가 일어나게 비운다
    event.target.value = ''
  }
  return (
    <Label className={cn('gap-2', className)}>
      <span>
        {title}
        {hint && ` (${hint})`}
      </span>
      <span className="flex flex-wrap items-center gap-3">
        <input
          type="file"
          aria-label={hint ? `${title} (${hint})` : title}
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={handleChange}
          className="peer sr-only"
        />
        <Button
          asChild
          variant="outline"
          className="peer-focus-visible:ring-ring/50 cursor-pointer peer-focus-visible:ring-3 peer-disabled:pointer-events-none peer-disabled:opacity-50 max-lg:h-11"
        >
          <span aria-hidden>{buttonText}</span>
        </Button>
        {status && <span className="text-ink-2 text-[13px] font-normal">{status}</span>}
      </span>
    </Label>
  )
}
