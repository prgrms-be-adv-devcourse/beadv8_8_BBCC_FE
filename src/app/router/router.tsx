import type { ComponentType } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'
import { NotFoundPage } from '@/pages/not-found'
import { paths } from '@/shared/config'
import { ConsoleLayout } from '../layouts/ConsoleLayout'
import { RouteFallback } from '../layouts/SessionGate'
import { ShopLayout } from '../layouts/ShopLayout'
import { WorkspaceLayout } from '../layouts/WorkspaceLayout'

// 영역: 쇼핑(/) · 판매자 센터(/center) · 관리자(/admin) · 시연 콘솔(/console). 주소는 shared/config/routes.ts
// 레이아웃만 바로 불러오고, 화면은 들어갈 때 불러온다 (번들 크기 경고 해소)

type LazyPage = () => Promise<{ Component: ComponentType }>
const page = (load: LazyPage) => ({ lazy: load })

const login = page(() => import('@/pages/login').then((m) => ({ Component: m.LoginPage })))
const kakaoCallback = page(() =>
  import('@/pages/kakao-callback').then((m) => ({ Component: m.KakaoCallbackPage })),
)
const children = page(() => import('@/pages/children').then((m) => ({ Component: m.ChildrenPage })))
const addresses = page(() =>
  import('@/pages/addresses').then((m) => ({ Component: m.AddressesPage })),
)
const wallet = page(() => import('@/pages/wallet').then((m) => ({ Component: m.WalletPage })))
const chargeSuccess = page(() =>
  import('@/pages/charge-result').then((m) => ({ Component: m.ChargeSuccessPage })),
)
const chargeFail = page(() =>
  import('@/pages/charge-result').then((m) => ({ Component: m.ChargeFailPage })),
)
const sellerApply = page(() =>
  import('@/pages/seller-apply').then((m) => ({ Component: m.SellerApplyPage })),
)
const sellerProducts = page(() =>
  import('@/pages/seller-products').then((m) => ({ Component: m.SellerProductsPage })),
)
const sellerOrders = page(() =>
  import('@/pages/seller-orders').then((m) => ({ Component: m.SellerOrdersPage })),
)
const sellerSettlements = page(() =>
  import('@/pages/seller-settlements').then((m) => ({ Component: m.SellerSettlementsPage })),
)
const adminSellerApplications = page(() =>
  import('@/pages/admin-seller-applications').then((m) => ({
    Component: m.AdminSellerApplicationsPage,
  })),
)
const adminSettlements = page(() =>
  import('@/pages/admin-settlements').then((m) => ({ Component: m.AdminSettlementsPage })),
)

/** 주소에서 앞의 영역 접두어를 뗀 상대 경로 */
const rel = (prefix: string, path: string) => path.slice(prefix.length + 1)

export const router = createBrowserRouter([
  {
    path: '/',
    element: <ShopLayout />,
    HydrateFallback: RouteFallback,
    children: [
      {
        index: true,
        ...page(() => import('@/pages/shop-home').then((m) => ({ Component: m.ShopHomePage }))),
      },
      { path: rel('', paths.login), ...login },
      { path: rel('', paths.kakaoCallback), ...kakaoCallback },
      {
        path: 'products/:productId',
        ...page(() =>
          import('@/pages/shop-product-detail').then((m) => ({
            Component: m.ShopProductDetailPage,
          })),
        ),
      },
      {
        path: rel('', paths.shop.cart),
        ...page(() => import('@/pages/shop-cart').then((m) => ({ Component: m.ShopCartPage }))),
      },
      {
        path: rel('', paths.shop.orders),
        ...page(() => import('@/pages/shop-orders').then((m) => ({ Component: m.ShopOrdersPage }))),
      },
      {
        path: 'orders/:orderId',
        ...page(() =>
          import('@/pages/shop-order-detail').then((m) => ({ Component: m.ShopOrderDetailPage })),
        ),
      },
      {
        path: rel('', paths.shop.my),
        ...page(() => import('@/pages/shop-my').then((m) => ({ Component: m.ShopMyPage }))),
      },
      { path: rel('', paths.shop.children), ...children },
      { path: rel('', paths.shop.addresses), ...addresses },
      { path: rel('', paths.shop.wallet), ...wallet },
      { path: rel('', paths.shop.chargeSuccess), ...chargeSuccess },
      { path: rel('', paths.shop.chargeFail), ...chargeFail },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    path: paths.center.home,
    element: (
      <WorkspaceLayout
        title="판매자 센터"
        role="SELLER"
        openPaths={[paths.center.apply]}
        guide={{ to: paths.center.apply, label: '판매자 신청하러 가기' }}
        items={[
          { to: paths.center.home, label: '홈', end: true },
          { to: paths.center.products, label: '상품 관리' },
          { to: paths.center.orders, label: '주문 · 배송' },
          { to: paths.center.settlements, label: '정산' },
          { to: paths.center.apply, label: '판매자 신청' },
        ]}
      />
    ),
    HydrateFallback: RouteFallback,
    children: [
      {
        index: true,
        ...page(() => import('@/pages/center-home').then((m) => ({ Component: m.CenterHomePage }))),
      },
      { path: rel(paths.center.home, paths.center.apply), ...sellerApply },
      { path: rel(paths.center.home, paths.center.products), ...sellerProducts },
      { path: rel(paths.center.home, paths.center.orders), ...sellerOrders },
      { path: rel(paths.center.home, paths.center.settlements), ...sellerSettlements },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    path: paths.admin.home,
    element: (
      <WorkspaceLayout
        title="Kidly 관리자"
        role="ADMIN"
        items={[
          { to: paths.admin.sellerApplications, label: '판매자 신청 심사' },
          { to: paths.admin.settlements, label: '정산 실행' },
        ]}
      />
    ),
    HydrateFallback: RouteFallback,
    children: [
      { index: true, element: <Navigate to={paths.admin.sellerApplications} replace /> },
      { path: rel(paths.admin.home, paths.admin.sellerApplications), ...adminSellerApplications },
      { path: rel(paths.admin.home, paths.admin.settlements), ...adminSettlements },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    path: paths.console.home,
    element: <ConsoleLayout />,
    HydrateFallback: RouteFallback,
    children: [
      {
        index: true,
        ...page(() => import('@/pages/home').then((m) => ({ Component: m.HomePage }))),
      },
      {
        path: rel(paths.console.home, paths.console.verify),
        ...page(() => import('@/pages/verify').then((m) => ({ Component: m.VerifyPage }))),
      },
      { path: rel(paths.console.home, paths.console.children), ...children },
      { path: rel(paths.console.home, paths.console.addresses), ...addresses },
      {
        path: rel(paths.console.home, paths.console.products),
        ...page(() => import('@/pages/products').then((m) => ({ Component: m.ProductsPage }))),
      },
      {
        path: 'products/:productId',
        ...page(() =>
          import('@/pages/product-detail').then((m) => ({ Component: m.ProductDetailPage })),
        ),
      },
      {
        path: rel(paths.console.home, paths.console.cart),
        ...page(() => import('@/pages/cart').then((m) => ({ Component: m.CartPage }))),
      },
      {
        path: rel(paths.console.home, paths.console.orders),
        ...page(() => import('@/pages/orders').then((m) => ({ Component: m.OrdersPage }))),
      },
      {
        path: 'orders/:orderId',
        ...page(() =>
          import('@/pages/order-detail').then((m) => ({ Component: m.OrderDetailPage })),
        ),
      },
      { path: rel(paths.console.home, paths.console.wallet), ...wallet },
      { path: rel(paths.console.home, paths.console.chargeSuccess), ...chargeSuccess },
      { path: rel(paths.console.home, paths.console.chargeFail), ...chargeFail },
      { path: rel(paths.console.home, paths.console.sellerApply), ...sellerApply },
      { path: rel(paths.console.home, paths.console.sellerProducts), ...sellerProducts },
      { path: rel(paths.console.home, paths.console.sellerOrders), ...sellerOrders },
      { path: rel(paths.console.home, paths.console.sellerSettlements), ...sellerSettlements },
      {
        path: rel(paths.console.home, paths.console.adminSellerApplications),
        ...adminSellerApplications,
      },
      { path: rel(paths.console.home, paths.console.adminSettlements), ...adminSettlements },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
