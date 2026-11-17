import { useEffect, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { restoreChildSession, useChildSessionStore } from '@/entities/session'
import { useChildOnboardingQuery } from '@/entities/child-onboarding'
import { ChildOnboarding } from '@/features/complete-child-onboarding'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { Button } from '@/shared/ui/button'
import { ChildLoginForm } from '@/features/auth-child-login'

type ChildGateProps = { children: ReactNode }
export function ChildGate({ children }: ChildGateProps) {
  const accessToken = useChildSessionStore((state) => state.accessToken)
  const status = useChildSessionStore((state) => state.status)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  useEffect(() => {
    if (useChildSessionStore.getState().status === 'idle') void restoreChildSession()
  }, [])
  if (accessToken) return <OnboardingGate>{children}</OnboardingGate>
  if (status !== 'ready') return <p>로그인 확인 중…</p>
  return (
    <section className="border-rule max-w-md space-y-4 rounded-lg border p-6">
      <h1 className="text-section">자녀 로그인</h1>
      {/* 자녀 첫 화면(프로필)에서 로그인하면 자녀 메인(상품)으로 보낸다. 다른 자녀 화면이면 그 화면에 머문다 */}
      <ChildLoginForm
        onSuccess={() => {
          if (pathname === paths.child.home) void navigate(paths.child.products, { replace: true })
        }}
      />
    </section>
  )
}

function OnboardingGate({ children }: ChildGateProps) {
  const query = useChildOnboardingQuery()
  if (query.isPending) return <p>확인 중…</p>
  if (query.isError)
    return (
      <div className="space-y-2">
        <p role="alert">{getErrorMessage(query.error)}</p>
        <Button variant="outline" onClick={() => void query.refetch()}>
          다시 시도
        </Button>
      </div>
    )
  return query.data.noticeConfirmed ? children : <ChildOnboarding />
}
