import { Outlet } from 'react-router'
import { MyPageMenu } from '@/widgets/my-page-menu'

/** 쇼핑 마이페이지 묶음(홈 · 예치금 · 배송지 · 내 정보): 왼쪽 메뉴(휴대폰은 아래) + 화면 */
export function ShopMyLayout() {
  return (
    <div className="shop-look grid items-start gap-10 lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-14">
      <MyPageMenu className="max-lg:order-last lg:sticky lg:top-32" />
      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  )
}
