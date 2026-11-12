import { useState, type FormEvent } from 'react'
import {
  isValidChildLoginId,
  isValidChildPassword,
  type ChildAccount,
} from '@/entities/child-account'
import { getErrorMessage } from '@/shared/api'
import { confirmAction } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useManageChildAccount } from '../model/use-manage-child-account'

type ManageChildAccountProps = { childId: string; account?: ChildAccount }

export function ManageChildAccount({ childId, account }: ManageChildAccountProps) {
  const { create, reset, remove } = useManageChildAccount(childId)
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [invalid, setInvalid] = useState<string | null>(null)
  const pending = create.isPending || reset.isPending || remove.isPending
  const error = create.error || reset.error || remove.error
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!account && !isValidChildLoginId(loginId))
      return setInvalid('아이디는 영문 소문자와 숫자 4~20자로 입력해 주세요.')
    if (!isValidChildPassword(password))
      return setInvalid('비밀번호는 8자 이상, 영문 · 숫자 72자(한글 24자) 이하로 입력해 주세요.')
    setInvalid(null)
    if (account) {
      if (
        await confirmAction({
          title: '비밀번호를 재설정할까요?',
          description: '자녀가 다시 로그인해야 해요.',
          confirmLabel: '재설정',
        })
      ) {
        reset.mutate({ id: account.id, password }, { onSuccess: () => setPassword('') })
      }
    } else {
      create.mutate({ loginId, password }, { onSuccess: () => setPassword('') })
    }
  }
  const handleDelete = async () => {
    if (
      account &&
      (await confirmAction({
        title: '자녀 계정을 삭제할까요?',
        description: '자녀 프로필은 남아요.',
        confirmLabel: '삭제',
        tone: 'danger',
      }))
    )
      remove.mutate(account.id)
  }
  return (
    <section aria-label="자녀 계정" className="border-rule space-y-4 rounded-lg border p-5">
      <h2 className="text-section">자녀 계정</h2>
      {account && <p>아이디: {account.loginId}</p>}
      <form onSubmit={handleSubmit} className="space-y-3">
        {!account && (
          <div className="space-y-1">
            <Label htmlFor="child-login-id">아이디</Label>
            <Input
              id="child-login-id"
              value={loginId}
              onChange={(event) => setLoginId(event.target.value)}
              autoComplete="off"
            />
          </div>
        )}
        <div className="space-y-1">
          <Label htmlFor="child-password">{account ? '새 비밀번호' : '비밀번호'}</Label>
          <Input
            id="child-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
          />
        </div>
        <Button type="submit" disabled={pending}>
          {account ? '비밀번호 재설정' : '계정 발급'}
        </Button>
        {account && (
          <Button type="button" variant="destructive" disabled={pending} onClick={handleDelete}>
            계정 삭제
          </Button>
        )}
      </form>
      {invalid && <StateMessage tone="error">{invalid}</StateMessage>}
      {error && <StateMessage tone="error">{getErrorMessage(error)}</StateMessage>}
    </section>
  )
}
