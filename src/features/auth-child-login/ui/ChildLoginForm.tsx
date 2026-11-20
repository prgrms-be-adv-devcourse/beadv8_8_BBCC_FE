import { useState, type FormEvent } from 'react'
import { getErrorMessage } from '@/shared/api'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useChildLogin } from '../model/use-child-login'

type ChildLoginFormProps = {
  /** 로그인에 성공한 뒤 할 일 (어디로 보낼지는 부르는 쪽이 정한다) */
  onSuccess?: () => void
}

const FIELD =
  'border-ink bg-paper text-ink h-[58px] w-full border-2 px-4 text-lg focus-visible:shadow-[4px_4px_0_var(--shop-marker)]'

export function ChildLoginForm({ onSuccess }: ChildLoginFormProps) {
  const login = useChildLogin(onSuccess)
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    login.mutate({ loginId, password })
  }
  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <label className="block space-y-2">
        <span className="block text-[15px] font-bold">아이디</span>
        <input
          required
          autoComplete="username"
          placeholder="예: seoyun"
          className={FIELD}
          value={loginId}
          onChange={(event) => setLoginId(event.target.value)}
        />
      </label>
      <div className="space-y-2">
        <label htmlFor="child-login-password" className="block text-[15px] font-bold">
          비밀번호
        </label>
        <div className="relative">
          <input
            id="child-login-password"
            required
            type={isPasswordShown ? 'text' : 'password'}
            autoComplete="current-password"
            className={`${FIELD} pr-14`}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button
            type="button"
            aria-label="입력한 글자 보기"
            aria-pressed={isPasswordShown}
            onClick={() => setIsPasswordShown((shown) => !shown)}
            className="text-ink absolute top-[7px] right-1.5 flex size-11 items-center justify-center"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
              <circle cx="12" cy="12" r="3" />
              {isPasswordShown && <path d="M4 4l16 16" />}
            </svg>
          </button>
        </div>
      </div>
      <button
        type="submit"
        disabled={login.isPending}
        aria-busy={login.isPending}
        className="shop-btn min-h-[60px] w-full text-lg"
      >
        로그인
      </button>
      {login.isError && <StateMessage tone="error">{getErrorMessage(login.error)}</StateMessage>}
    </form>
  )
}
