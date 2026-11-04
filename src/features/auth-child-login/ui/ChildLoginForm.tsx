import { useState, type FormEvent } from 'react'
import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useChildLogin } from '../model/use-child-login'

export function ChildLoginForm() {
  const login = useChildLogin()
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    login.mutate({ loginId, password })
  }
  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <Label>
        아이디
        <Input
          required
          autoComplete="username"
          value={loginId}
          onChange={(event) => setLoginId(event.target.value)}
        />
      </Label>
      <Label>
        비밀번호
        <Input
          required
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </Label>
      <Button type="submit" disabled={login.isPending}>
        로그인
      </Button>
      {login.isError && <StateMessage tone="error">{getErrorMessage(login.error)}</StateMessage>}
    </form>
  )
}
