import { useEffect, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { useOwnChildProfileQuery } from '@/entities/child'
import { restoreChildSession, useChildSessionStore } from '@/entities/session'
import { useChildOnboardingQuery } from '@/entities/child-onboarding'
import { ChildOnboarding } from '@/features/complete-child-onboarding'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/StateMessage'
import { ChildLoginForm } from '@/features/auth-child-login'

const WAITING = 'max-w-shop mx-auto w-full px-4 py-12 md:px-8'

type ChildGateProps = { children: ReactNode }
export function ChildGate({ children }: ChildGateProps) {
  const accessToken = useChildSessionStore((state) => state.accessToken)
  const status = useChildSessionStore((state) => state.status)
  const navigate = useNavigate()
  useEffect(() => {
    if (useChildSessionStore.getState().status === 'idle') void restoreChildSession()
  }, [])
  if (accessToken) return <OnboardingGate>{children}</OnboardingGate>
  if (status !== 'ready')
    return (
      <div className={WAITING}>
        <StateMessage>로그인 확인 중…</StateMessage>
      </div>
    )
  return (
    <div className="flex flex-1 flex-wrap">
      <section className="bg-sheet border-ink relative flex flex-[1_1_520px] flex-col justify-center gap-4 overflow-hidden border-b-2 px-4 py-10 md:min-h-[560px] md:border-r-2 md:border-b-0 md:px-14 md:py-12">
        <span className="bg-marker border-ink font-hand relative z-10 -rotate-3 self-start border-[1.5px] px-3 text-lg font-bold md:text-[22px]">
          어린이 전용
        </span>
        <h1 className="font-display relative z-10 text-[56px] leading-[0.95] md:text-[96px]">
          <span className="block">내 옷장</span>
          <span className="block">열기</span>
        </h1>
        <p className="font-hand relative z-10 text-[21px] leading-snug md:text-[28px]">
          보호자가 만들어 준 아이디로 들어와!
        </p>
        <svg
          aria-hidden
          viewBox="0 0 140 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          className="text-ink absolute -right-10 bottom-10 hidden h-[300px] w-[420px] opacity-90 lg:block"
        >
          <path d="M70 12a6 6 0 1 1 6 6c-3 0-6 2-6 5v3" />
          <path d="M70 26L18 56h104z" />
          <path d="M40 60l10 6 10-6 12 9-6 10-6-3v22H40V76l-6 3-6-10z" fill="var(--shop-marker)" />
          <path d="M88 60h22l2 38h-9l-4-22-4 22h-9z" fill="var(--shop-paper)" />
        </svg>
      </section>
      <section className="flex flex-[1_1_520px] items-center justify-center px-4 py-10 md:px-14 md:py-12">
        <div className="w-full max-w-[420px] space-y-5">
          <h2 className="font-display text-[32px] md:text-[40px]">자녀 로그인</h2>
          {/* 로그인하면 어느 자녀 화면에서든 내 옷장(/child)으로 보낸다. 첫 로그인이면 그 자리에 첫 안내가 나온다 */}
          <ChildLoginForm onSuccess={() => void navigate(paths.child.home, { replace: true })} />
          <p className="text-sm leading-relaxed">
            아이디나 비밀번호가 생각나지 않으면 보호자에게 물어봐.
          </p>
          <div className="border-rule flex flex-wrap items-center justify-between gap-3 border-t-[1.5px] pt-4">
            <span className="text-sm">보호자라면?</span>
            <Link
              to={paths.login}
              className="text-ink flex min-h-11 items-center text-[15px] font-bold underline underline-offset-4"
            >
              보호자 로그인 →
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

function OnboardingGate({ children }: ChildGateProps) {
  const query = useChildOnboardingQuery()
  const profile = useOwnChildProfileQuery()
  if (query.isPending)
    return (
      <div className={WAITING}>
        <StateMessage>확인 중…</StateMessage>
      </div>
    )
  if (query.isError)
    return (
      <div className={`${WAITING} space-y-2`}>
        <p role="alert">{getErrorMessage(query.error)}</p>
        <Button variant="outline" onClick={() => void query.refetch()}>
          다시 시도
        </Button>
      </div>
    )
  return query.data.noticeConfirmed ? children : <ChildOnboarding name={profile.data?.name} />
}
