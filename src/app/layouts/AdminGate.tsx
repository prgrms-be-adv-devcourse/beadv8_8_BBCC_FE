import { useEffect, type ReactNode } from 'react'
import { restoreAdminSession, useAdminSessionStore } from '@/entities/session'
import { AdminLoginForm } from '@/features/auth-admin-login'

type AdminGateProps = { children: ReactNode }

/**
 * 관리자 화면: 관리자 계정으로 로그인했을 때만 그린다 (BE #755: 관리자 API는 관리자 토큰만 받는다).
 * 관리자 화면에 처음 들어올 때만 관리자 재발급 쿠키로 복원해 본다 (쇼핑 화면 흐름 기록에 남지 않게)
 */
export function AdminGate({ children }: AdminGateProps) {
  const accessToken = useAdminSessionStore((state) => state.accessToken)
  const status = useAdminSessionStore((state) => state.status)

  useEffect(() => {
    if (useAdminSessionStore.getState().status === 'idle') {
      void restoreAdminSession()
    }
  }, [])

  if (accessToken) {
    return children
  }
  if (status !== 'ready') {
    return <p className="text-muted-foreground text-sm">로그인 확인 중…</p>
  }
  return (
    <section className="border-rule max-w-md space-y-4 rounded-lg border p-6">
      <h1 className="text-section">관리자 로그인</h1>
      <p className="text-ink-2 text-[15px]">관리자 계정으로 로그인하면 볼 수 있는 화면이에요.</p>
      <AdminLoginForm />
    </section>
  )
}
