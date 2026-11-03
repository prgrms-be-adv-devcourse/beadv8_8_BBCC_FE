import { useState, type FormEvent } from 'react'
import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useAdminLogin } from '../model/use-admin-login'

/** 관리자 계정(이메일 · 비밀번호) 로그인. 로그인하면 관리자 화면이 열린다 */
export function AdminLoginForm() {
  const login = useAdminLogin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    login.mutate({ email, password })
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <Label>
        이메일
        <Input
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Label>
      <Label>
        비밀번호
        <Input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Label>
      <Button type="submit" disabled={login.isPending}>
        관리자 로그인
      </Button>
      {login.isError && <StateMessage tone="error">{getErrorMessage(login.error)}</StateMessage>}
    </form>
  )
}
