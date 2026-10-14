import { NavLink } from 'react-router'
import { cn } from '@/shared/lib'

export type SideNavItem = { to: string; label: string; end?: boolean }

/** 판매자 센터 · 관리자 왼쪽 메뉴 */
function SideNav({ title, items }: { title: string; items: SideNavItem[] }) {
  return (
    <nav className="flex w-52 shrink-0 flex-col gap-1 border-r bg-white p-3">
      <p className="text-primary mb-2 px-2 text-lg font-extrabold">{title}</p>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              'rounded-md px-2 py-1.5 text-sm',
              isActive ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted',
            )
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}

export { SideNav }
