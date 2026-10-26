import { NavLink } from 'react-router'
import { hasRole, useSessionStore } from '@/entities/session'
import { paths } from '@/shared/config'
import { cn } from '@/shared/lib'

type MyPageMenuProps = { className?: string }

/**
 * 마이페이지 왼쪽 메뉴: 관심사별 네 묶음 (쇼핑 · 우리 아이 · 계정 · 판매).
 * API를 부르지 않는다 (판매자 여부는 세션의 역할로 본다)
 */
export function MyPageMenu({ className }: MyPageMenuProps) {
  const user = useSessionStore((state) => state.user)
  const groups = [
    {
      title: '쇼핑',
      links: [
        { to: paths.shop.orders, label: '주문 내역' },
        { to: paths.shop.cart, label: '장바구니' },
      ],
    },
    {
      title: '우리 아이',
      links: [
        { to: paths.shop.children, label: '자녀 프로필' },
        { to: paths.shop.childNew, label: '자녀 등록' },
      ],
    },
    {
      title: '계정',
      links: [
        // 이용 내역(/my/wallet/history)에서도 예치금이 골라진 것으로
        { to: paths.shop.wallet, label: '예치금', isPrefix: true },
        { to: paths.shop.addresses, label: '배송지 관리' },
        { to: paths.shop.profile, label: '내 정보' },
      ],
    },
    {
      title: '판매',
      links: [
        hasRole(user, 'SELLER')
          ? { to: paths.center.home, label: '판매자 센터' }
          : { to: paths.center.apply, label: '판매자 신청' },
      ],
    },
  ]

  return (
    <nav aria-label="마이페이지 메뉴" className={cn('space-y-7', className)}>
      <p className="text-page font-bold max-lg:hidden">마이페이지</p>
      {groups.map((group) => (
        <div key={group.title} className="space-y-1.5">
          <p className="text-ink-3 text-[13px] font-semibold">{group.title}</p>
          <ul>
            {group.links.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={!('isPrefix' in link && link.isPrefix)}
                  className={({ isActive }) =>
                    cn(
                      'hover:text-ink block py-1.5 text-[15px] transition-colors',
                      isActive ? 'text-ink font-bold' : 'text-ink-2',
                    )
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}
