import { useState, type FormEvent } from 'react'
import { getErrorMessage } from '@/shared/api'
import { formatDateTime } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { StateMessage } from '@/shared/ui/StateMessage'
import { ADMIN_PASSWORD_MIN_LENGTH, validateAdminPassword } from '../model/admin-account.rules'
import { useCreateAdmin } from '../model/use-manage-admin-account'

/** 관리자 추가: 이메일 · 비밀번호를 받아 만들고, 만든 계정을 아래에 보여 준다 */
export function CreateAdminForm() {
  const create = useCreateAdmin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [invalid, setInvalid] = useState<string | null>(null)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const problem = validateAdminPassword(password)
    setInvalid(problem)
    if (problem) return
    create.mutate(
      { email, password },
      {
        onSuccess: () => {
          setEmail('')
          setPassword('')
        },
      },
    )
  }

  return (
    <div className="space-y-5">
      <form className="space-y-3" onSubmit={handleSubmit}>
        <Label>
          이메일
          <Input
            type="email"
            autoComplete="off"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Label>
        <Label>
          비밀번호
          <Input
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Label>
        <p className="text-ink-3 text-[13px]">
          비밀번호는 {ADMIN_PASSWORD_MIN_LENGTH}자 이상이에요.
        </p>
        <Button type="submit" disabled={create.isPending}>
          관리자 추가
        </Button>
        {invalid && <StateMessage tone="error">{invalid}</StateMessage>}
        {create.isError && (
          <StateMessage tone="error">
            {create.isEmailTaken
              ? '이미 등록된 이메일이에요. 다른 이메일을 입력해 주세요.'
              : getErrorMessage(create.error)}
          </StateMessage>
        )}
      </form>
      {create.data && (
        <section aria-label="추가한 관리자" className="border-rule rounded-lg border p-4 text-sm">
          <p className="font-bold">관리자를 추가했어요</p>
          <dl className="mt-2 grid grid-cols-[5rem_1fr] gap-y-1">
            <dt className="text-ink-3">이메일</dt>
            <dd>{create.data.email}</dd>
            <dt className="text-ink-3">관리자 ID</dt>
            <dd>{create.data.id}</dd>
            <dt className="text-ink-3">만든 시각</dt>
            <dd>{formatDateTime(create.data.createdAt)}</dd>
          </dl>
        </section>
      )}
    </div>
  )
}
