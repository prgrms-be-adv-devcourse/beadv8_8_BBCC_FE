import { useEffect, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { restoreChildSession, useChildSessionStore } from '@/entities/session'
import { useChildOnboardingQuery } from '@/entities/child-onboarding'
import { ChildOnboarding } from '@/features/complete-child-onboarding'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { Button } from '@/shared/ui/button'
import { PageHeader } from '@/shared/ui/PageHeader'
import { ChildLoginForm } from '@/features/auth-child-login'

type ChildGateProps = { children: ReactNode }
export function ChildGate({ children }: ChildGateProps) {
  const accessToken = useChildSessionStore((state) => state.accessToken)
  const status = useChildSessionStore((state) => state.status)
  const navigate = useNavigate()
  useEffect(() => {
    if (useChildSessionStore.getState().status === 'idle') void restoreChildSession()
  }, [])
  if (accessToken) return <OnboardingGate>{children}</OnboardingGate>
  if (status !== 'ready') return <p>로그인 확인 중…</p>
  return (
    <div className="space-y-4">
      <PageHeader
        title="자녀 로그인"
        description="보호자가 만들어 준 아이디와 비밀번호로 로그인해요."
      />
      <div className="border-ink border-[1.5px] p-4 md:p-6">
        <div className="max-w-md">
          {/* 로그인하면 어느 자녀 화면에서든 쇼핑 홈(/)으로 보낸다 */}
          <ChildLoginForm onSuccess={() => void navigate(paths.shop.home, { replace: true })} />
        </div>
      </div>
      <Link to={paths.login} className="text-primary inline-block underline">
        보호자 로그인
      </Link>
    </div>
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
