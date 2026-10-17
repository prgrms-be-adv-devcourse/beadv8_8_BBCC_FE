import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router'
import { describeUser, useSessionStore } from '@/entities/session'
import { LogoutButton } from '@/features/logout'
import { SwitchDemoRole } from '@/features/switch-demo-role'
import { AREA_LABEL, paths, useDemoRoleSwitch, type Area } from '@/shared/config'
import { cn, useArea } from '@/shared/lib'

const AREA_HOME: Record<Area, string> = {
  shop: paths.shop.home,
  center: paths.center.home,
  admin: paths.admin.home,
  console: paths.console.home,
}

const ALL_AREAS = Object.keys(AREA_HOME) as Area[]

type DemoBarProps = { actions?: ReactNode }

/** 모든 영역 맨 위의 막대: 영역 전환 · 시연 역할 · 로그인 상태 · (오른쪽 동작). 시연 기능을 끄면 시연 표시와 시연 콘솔 메뉴를 뺀다 */
export function DemoBar({ actions }: DemoBarProps) {
  const area = useArea()
  const user = useSessionStore((state) => state.user)
  const status = useSessionStore((state) => state.status)
  const demoRoleSwitch = useDemoRoleSwitch()
  // 시연 기능을 끄면 시연 콘솔로 가는 메뉴를 빼고 쇼핑 · 판매자 센터 · 관리자만 둔다
  const areas = demoRoleSwitch ? ALL_AREAS : ALL_AREAS.filter((key) => key !== 'console')

  return (
    <div className="flex h-11 shrink-0 items-center gap-3 overflow-x-auto border-b bg-slate-900 px-4 whitespace-nowrap text-white [&>*]:shrink-0">
      {demoRoleSwitch && <span className="text-xs font-semibold text-slate-400">시연</span>}
      <nav className="flex gap-1">
        {areas.map((key) => (
          <NavLink
            key={key}
            to={AREA_HOME[key]}
            className={cn(
              'rounded px-2 py-1 text-xs',
              area === key ? 'bg-white text-slate-900' : 'text-slate-300 hover:bg-slate-700',
            )}
          >
            {AREA_LABEL[key]}
          </NavLink>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-3 [&_button]:h-7">
        {demoRoleSwitch && (
          <div className="rounded-md bg-white px-1 py-0.5 text-slate-900">
            <SwitchDemoRole />
          </div>
        )}
        <span className="text-xs">
          {status === 'restoring' ? '로그인 확인 중…' : user ? describeUser(user) : '로그인 전'}
        </span>
        {user ? (
          <LogoutButton />
        ) : (
          <Link to={paths.login} className="text-xs underline">
            로그인
          </Link>
        )}
        {actions}
      </div>
    </div>
  )
}
