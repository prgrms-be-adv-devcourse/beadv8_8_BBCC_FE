import { Outlet } from 'react-router'
import { MyPageMenu } from '@/widgets/my-page-menu'

/** 쇼핑 마이페이지 묶음: 메뉴(넓은 화면은 왼쪽, 휴대폰은 화면 위 한 줄) + 화면 */
export function ShopMyLayout() {
  return (
    <div className="shop-look grid items-start gap-6 lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-14">
      <MyPageMenu className="lg:sticky lg:top-32" />
      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  )
}
