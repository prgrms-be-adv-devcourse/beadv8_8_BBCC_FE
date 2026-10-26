import { Link } from 'react-router'
import { paths } from '@/shared/config'

/** 알림함: 알림 기능 전이라 화면만 둔다 (API를 부르지 않고 빈 알림함을 보여 준다) */
export function ShopNotificationsPage() {
  return (
    <div className="shop-look space-y-6">
      <h1 className="text-page">알림</h1>
      <div className="bg-paper-2 rounded-card flex flex-col items-center gap-3 px-4 py-16 text-center">
        <svg
          viewBox="0 0 24 24"
          className="text-ink-3 size-10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden
        >
          <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16Z" />
          <path d="M10 20.5a2 2 0 0 0 4 0" />
        </svg>
        <p className="text-ink-2 text-base font-semibold">아직 받은 알림이 없어요.</p>
        <p className="text-ink-3 text-sm">주문 · 배송 소식이 생기면 여기에서 알려 드릴게요.</p>
        <Link to={paths.shop.home} className="shop-link">
          상품 보러 가기
        </Link>
      </div>
    </div>
  )
}
