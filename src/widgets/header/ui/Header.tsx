import { Link } from 'react-router'
import { useSessionStore } from '@/entities/session'
import { LogoutButton } from '@/features/logout'
import { SwitchDemoRole } from '@/features/switch-demo-role'

export function Header() {
  const user = useSessionStore((state) => state.user)
  const status = useSessionStore((state) => state.status)

  return (
    <header className="bg-background border-b">
      <div className="flex h-14 items-center gap-4 px-4">
        <Link to="/" className="text-primary text-lg font-bold">
          Kidly
        </Link>
        <div className="ml-auto flex items-center gap-3">
          <SwitchDemoRole />
          <span className="text-sm">
            {status === 'restoring'
              ? '로그인 확인 중…'
              : user
                ? `${user.nickname} · 회원 ${user.memberId} (${user.roles.join(' · ')})`
                : '로그인 전'}
          </span>
          {user ? (
            <LogoutButton />
          ) : (
            <Link to="/login" className="text-primary text-sm underline">
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
