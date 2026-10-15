import { NavLink } from 'react-router'
import { hasRole, ROLE_LABEL, useSessionStore } from '@/entities/session'
import { paths } from '@/shared/config'
import { cn } from '@/shared/lib'
import { DEMO_STEPS } from '../config/steps'

/** 시연 단계 ①~⑦ = 메뉴. 지금 역할로 쓸 수 없는 화면은 흐리게 표시한다 */
export function DemoStepBar() {
  const user = useSessionStore((state) => state.user)

  return (
    <nav className="flex flex-wrap gap-1 border-b bg-white px-4 py-2">
      <NavLink
        to={paths.console.verify}
        className={({ isActive }) =>
          cn(
            'shrink-0 rounded-lg border px-2 py-1 text-xs font-semibold',
            isActive ? 'bg-primary text-primary-foreground' : 'border-primary text-primary',
          )
        }
      >
        ✓ 흐름 확인
      </NavLink>
      {DEMO_STEPS.map((step) => (
        <div
          key={step.step}
          className="flex shrink-0 items-center gap-1 rounded-lg border px-2 py-1"
        >
          <span className="text-primary text-sm font-bold">{step.step}</span>
          <span className="mr-1 text-xs font-medium">{step.title}</span>
          {step.links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              title={`${ROLE_LABEL[link.role]} 화면`}
              className={({ isActive }) =>
                cn(
                  'rounded px-1.5 py-0.5 text-xs',
                  isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                  !isActive && !hasRole(user, link.role) && 'text-muted-foreground opacity-60',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  )
}
