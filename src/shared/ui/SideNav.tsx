import { NavLink } from 'react-router'
import { cn } from '@/shared/lib'

export type SideNavItem = { to: string; label: string; end?: boolean }

type SideNavProps = {
  title: string
  items: SideNavItem[]
  /** dark: 어두운 배경 (관리자) */
  tone?: 'light' | 'dark'
}

/** 판매자 센터 · 관리자 왼쪽 메뉴. 좁은 화면(md 미만)에서는 본문 위 가로 메뉴로 바뀐다 */
export function SideNav({ title, items, tone = 'light' }: SideNavProps) {
  const dark = tone === 'dark'
  return (
    <nav
      className={cn(
        'flex shrink-0 gap-1 overflow-x-auto border-b p-2 whitespace-nowrap md:w-52 md:flex-col md:overflow-x-visible md:border-r md:border-b-0 md:p-3',
        dark ? 'border-zinc-800 bg-zinc-900 text-zinc-300' : 'bg-white',
      )}
    >
      <p
        className={cn(
          'hidden px-2 text-lg font-extrabold md:mb-2 md:block',
          dark ? 'text-white' : 'text-primary',
        )}
      >
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
