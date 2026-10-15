import { NavLink } from 'react-router'
import { cn } from '@/shared/lib'

export type SideNavItem = { to: string; label: string; end?: boolean }

type SideNavProps = {
  title: string
  items: SideNavItem[]
  /** dark: 어두운 배경 (관리자) */
  tone?: 'light' | 'dark'
}

/** 판매자 센터 · 관리자 왼쪽 메뉴 */
export function SideNav({ title, items, tone = 'light' }: SideNavProps) {
  const dark = tone === 'dark'
  return (
    <nav
      className={cn(
        'flex w-52 shrink-0 flex-col gap-1 border-r p-3',
        dark ? 'border-zinc-800 bg-zinc-900 text-zinc-300' : 'bg-white',
      )}
    >
      <p className={cn('mb-2 px-2 text-lg font-extrabold', dark ? 'text-white' : 'text-primary')}>
        {title}
      </p>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              'rounded-md px-2 py-1.5 text-sm',
              dark
                ? isActive
                  ? 'bg-zinc-700 font-semibold text-white'
                  : 'hover:bg-zinc-800 hover:text-white'
                : isActive
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'hover:bg-muted',
            )
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
