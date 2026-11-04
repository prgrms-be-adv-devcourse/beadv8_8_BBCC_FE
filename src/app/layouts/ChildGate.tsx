import { useEffect, type ReactNode } from 'react'
import { restoreChildSession, useChildSessionStore } from '@/entities/session'
import { ChildLoginForm } from '@/features/auth-child-login'

type ChildGateProps = { children: ReactNode }
export function ChildGate({ children }: ChildGateProps) {
  const accessToken = useChildSessionStore((state) => state.accessToken)
  const status = useChildSessionStore((state) => state.status)
  useEffect(() => {
    if (useChildSessionStore.getState().status === 'idle') void restoreChildSession()
  }, [])
  if (accessToken) return children
  if (status !== 'ready') return <p>로그인 확인 중…</p>
  return (
    <section className="border-rule max-w-md space-y-4 rounded-lg border p-6">
      <h1 className="text-section">자녀 로그인</h1>
      <ChildLoginForm />
    </section>
  )
}
