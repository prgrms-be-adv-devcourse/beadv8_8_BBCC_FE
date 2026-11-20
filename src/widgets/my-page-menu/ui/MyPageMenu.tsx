import { useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router'
import { hasRole, useSessionStore } from '@/entities/session'
import { countPendingWishes, useAllWishRequestsQuery } from '@/entities/wish'
import { paths } from '@/shared/config'
import { cn } from '@/shared/lib'

type MyPageMenuProps = { className?: string }

/**
 * 마이페이지 왼쪽 메뉴: 관심사별 네 묶음 (쇼핑 · 우리 아이 · 계정 · 판매).
 * 휴대폰은 묶음 제목 없이 화면 위 한 줄로 펼쳐 옆으로 넘긴다(지금 화면은 밑줄).
 * 판매자 여부는 세션의 역할로 본다. API는 「받은 조르기」 답을 기다리는 건수 하나만 읽는다 (사용자 승인 · #386)
 */
export function MyPageMenu({ className }: MyPageMenuProps) {
  const user = useSessionStore((state) => state.user)
  const wishes = useAllWishRequestsQuery({ enabled: !!user })
  const pendingWishes = wishes.data ? countPendingWishes(wishes.data) : 0
  const navRef = useRef<HTMLElement>(null)
  const { pathname } = useLocation()
  // 휴대폰 한 줄 메뉴: 지금 화면 메뉴가 잘리지 않게 그 칸까지 옆으로 넘긴다 (세로로는 움직이지 않는다)
  useEffect(() => {
    const nav = navRef.current
    const current = nav?.querySelector<HTMLElement>('[aria-current="page"]')
    if (!nav || !current || nav.scrollWidth <= nav.clientWidth) return
    nav.scrollLeft = current.offsetLeft - (nav.clientWidth - current.offsetWidth) / 2
  }, [pathname])
  const groups = [
    {
      title: '쇼핑',
      links: [
        { to: paths.shop.orders, label: '주문 내역' },
        { to: paths.shop.cart, label: '장바구니' },
        { to: paths.shop.reviews, label: '내 리뷰' },
        { to: paths.shop.favorites, label: '내 찜' },
      ],
    },
    {
      title: '우리 아이',
      links: [
        { to: paths.shop.wishes, label: '받은 조르기', count: pendingWishes },
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
    <nav
      ref={navRef}
      aria-label="마이페이지 메뉴"
      className={cn(
        'max-lg:border-ink max-lg:relative max-lg:-mx-4 max-lg:flex max-lg:overflow-x-auto max-lg:border-b-[1.5px] max-lg:px-2 lg:space-y-7',
        className,
      )}
    >
      <p className="text-page font-bold max-lg:hidden">마이페이지</p>
      {groups.map((group) => (
        <div key={group.title} className="max-lg:contents lg:space-y-1.5">
          <p className="text-ink-3 text-[13px] font-semibold max-lg:hidden">{group.title}</p>
          <ul className="max-lg:contents">
            {group.links.map((link) => (
              <li key={link.to} className="max-lg:shrink-0">
                <NavLink
                  to={link.to}
                  end={!('isPrefix' in link && link.isPrefix)}
                  className={({ isActive }) =>
                    cn(
                      'hover:text-ink block py-1.5 text-[15px] whitespace-nowrap transition-colors max-lg:px-2 max-lg:py-3 max-lg:text-sm',
                      isActive
                        ? 'text-ink font-bold max-lg:underline max-lg:decoration-2 max-lg:underline-offset-4'
                        : 'text-ink-2',
                    )
                  }
                >
                  {link.label}
                  {'count' in link && !!link.count && (
                    <span
                      aria-label={`답을 기다리는 조르기 ${link.count}건`}
                      className="bg-signal text-signal-ink figure rounded-pill ml-2 inline-flex min-w-5 items-center justify-center px-1.5 text-xs font-bold"
                    >
                      {link.count}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}
