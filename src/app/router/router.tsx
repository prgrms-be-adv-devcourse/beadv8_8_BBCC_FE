import type { ComponentType } from 'react'
import { createBrowserRouter, type RouteObject } from 'react-router'
import { NotFoundPage } from '@/pages/common/not-found'
import { paths } from '@/shared/config'
import { ConsoleLayout } from '../layouts/ConsoleLayout'
import { DemoOnly } from '../layouts/DemoOnly'
import { RouteError } from '../layouts/RouteError'
import { RouteFallback } from '../layouts/RouteFallback'
import { ShopLayout } from '../layouts/ShopLayout'
import { ShopMyLayout } from '../layouts/ShopMyLayout'
import { CenterLayout } from '../layouts/CenterLayout'
import { AdminLayout } from '../layouts/AdminLayout'

// 영역: 쇼핑(/) · 판매자 센터(/center) · 관리자(/admin) · 시연 콘솔(/console). 주소는 shared/config/routes.ts
// 레이아웃만 바로 불러오고, 화면은 들어갈 때 불러온다 (번들 크기 경고 해소)

type LazyPage = () => Promise<{ Component: ComponentType }>
const page = (load: LazyPage) => ({ lazy: load })

const login = page(() => import('@/pages/common/login').then((m) => ({ Component: m.LoginPage })))
const kakaoCallback = page(() =>
  import('@/pages/common/kakao-callback').then((m) => ({ Component: m.KakaoCallbackPage })),
)
const children = page(() =>
  import('@/pages/shop/children').then((m) => ({ Component: m.ShopChildrenPage })),
)
const walletCharge = page(() =>
  import('@/pages/shop/wallet-charge').then((m) => ({ Component: m.ShopWalletChargePage })),
)
const walletHistory = page(() =>
  import('@/pages/shop/wallet-history').then((m) => ({ Component: m.ShopWalletHistoryPage })),
)
const childNew = page(() =>
  import('@/pages/shop/child-new').then((m) => ({ Component: m.ShopChildNewPage })),
)
const childDetail = page(() =>
  import('@/pages/shop/child-detail').then((m) => ({ Component: m.ShopChildDetailPage })),
)
const profile = page(() =>
  import('@/pages/shop/profile').then((m) => ({ Component: m.ShopProfilePage })),
)
const addresses = page(() =>
  import('@/pages/shop/addresses').then((m) => ({ Component: m.ShopAddressesPage })),
)
const wallet = page(() =>
  import('@/pages/shop/wallet').then((m) => ({ Component: m.ShopWalletPage })),
)
const chargeSuccess = page(() =>
  import('@/pages/shop/charge-result').then((m) => ({ Component: m.ShopChargeSuccessPage })),
)
const chargeFail = page(() =>
  import('@/pages/shop/charge-result').then((m) => ({ Component: m.ShopChargeFailPage })),
)
const centerApply = page(() =>
  import('@/pages/center/apply').then((m) => ({ Component: m.CenterApplyPage })),
)
const centerProducts = page(() =>
  import('@/pages/center/products').then((m) => ({ Component: m.CenterProductsPage })),
)
const centerOrders = page(() =>
  import('@/pages/center/orders').then((m) => ({ Component: m.CenterOrdersPage })),
)
const centerSettlements = page(() =>
  import('@/pages/center/settlements').then((m) => ({ Component: m.CenterSettlementsPage })),
)
const centerProductNew = page(() =>
  import('@/pages/center/product-new').then((m) => ({ Component: m.CenterProductNewPage })),
)
const centerProductDetail = page(() =>
  import('@/pages/center/product-detail').then((m) => ({ Component: m.CenterProductDetailPage })),
)
const centerOrderDetail = page(() =>
  import('@/pages/center/order-detail').then((m) => ({ Component: m.CenterOrderDetailPage })),
)
const centerSettlementDetail = page(() =>
  import('@/pages/center/settlement-detail').then((m) => ({
    Component: m.CenterSettlementDetailPage,
  })),
)
const adminSellerApplications = page(() =>
  import('@/pages/admin/seller-applications').then((m) => ({
    Component: m.AdminSellerApplicationsPage,
  })),
)
const adminHome = page(() =>
  import('@/pages/admin/home').then((m) => ({ Component: m.AdminHomePage })),
)
const adminMembers = page(() =>
  import('@/pages/admin/members').then((m) => ({ Component: m.AdminMembersPage })),
)
const adminProducts = page(() =>
  import('@/pages/admin/products').then((m) => ({ Component: m.AdminProductsPage })),
)
const adminOrders = page(() =>
  import('@/pages/admin/orders').then((m) => ({ Component: m.AdminOrdersPage })),
)
const adminPayments = page(() =>
  import('@/pages/admin/payments').then((m) => ({ Component: m.AdminPaymentsPage })),
)
const adminMemberDetail = page(() =>
  import('@/pages/admin/member-detail').then((m) => ({ Component: m.AdminMemberDetailPage })),
)
const adminOrderDetail = page(() =>
  import('@/pages/admin/order-detail').then((m) => ({ Component: m.AdminOrderDetailPage })),
)
const adminPaymentDetail = page(() =>
  import('@/pages/admin/payment-detail').then((m) => ({ Component: m.AdminPaymentDetailPage })),
)
const adminSettlements = page(() =>
  import('@/pages/admin/settlements').then((m) => ({ Component: m.AdminSettlementsPage })),
)
const adminSettings = page(() =>
  import('@/pages/admin/settings').then((m) => ({ Component: m.AdminSettingsPage })),
)

/** 주소에서 앞의 영역 접두어를 뗀 상대 경로 */
const rel = (prefix: string, path: string) => path.slice(prefix.length + 1)

/**
 * 영역 레이아웃마다 오류 화면을 단다: 화면 오류는 레이아웃 안 본문 자리에(시연 막대 · 메뉴 · 흐름 패널 유지),
 * 레이아웃 자체 오류는 전체 화면으로
 */
function withRouteErrors(routes: RouteObject[]): RouteObject[] {
  return routes.map((route): RouteObject =>
    route.index || !route.children
      ? { ...route, errorElement: <RouteError fullPage /> }
      : {
          ...route,
          errorElement: <RouteError fullPage />,
          children: [{ errorElement: <RouteError />, children: route.children }],
        },
  )
}

export const router = createBrowserRouter(
  withRouteErrors([
    {
      path: '/',
      element: <ShopLayout />,
      HydrateFallback: RouteFallback,
      children: [
        {
          index: true,
          ...page(() => import('@/pages/shop/home').then((m) => ({ Component: m.ShopHomePage }))),
        },
        { path: rel('', paths.login), ...login },
        { path: rel('', paths.kakaoCallback), ...kakaoCallback },
        {
          path: 'products/:productId',
          ...page(() =>
            import('@/pages/shop/product-detail').then((m) => ({
              Component: m.ShopProductDetailPage,
            })),
          ),
        },
        {
          path: rel('', paths.shop.recommended(':childId')),
          ...page(() =>
            import('@/pages/shop/recommended').then((m) => ({
              Component: m.ShopRecommendedPage,
            })),
          ),
        },
        {
          path: rel('', paths.shop.cart),
          ...page(() => import('@/pages/shop/cart').then((m) => ({ Component: m.ShopCartPage }))),
        },
        {
          path: rel('', paths.shop.orders),
          ...page(() =>
            import('@/pages/shop/orders').then((m) => ({ Component: m.ShopOrdersPage })),
          ),
        },
        {
          path: 'orders/:orderId',
          ...page(() =>
            import('@/pages/shop/order-detail').then((m) => ({ Component: m.ShopOrderDetailPage })),
          ),
        },
        {
          path: rel('', paths.shop.notifications),
          ...page(() =>
            import('@/pages/shop/notifications').then((m) => ({
              Component: m.ShopNotificationsPage,
            })),
          ),
        },
        {
          // 마이페이지 묶음: 왼쪽 메뉴를 같이 쓴다 (자녀 화면은 넓은 배치라 뺀다)
          element: <ShopMyLayout />,
          children: [
            {
              path: rel('', paths.shop.my),
              ...page(() => import('@/pages/shop/my').then((m) => ({ Component: m.ShopMyPage }))),
            },
            { path: rel('', paths.shop.profile), ...profile },
            { path: rel('', paths.shop.addresses), ...addresses },
            { path: rel('', paths.shop.wallet), ...wallet },
            { path: rel('', paths.shop.walletHistory), ...walletHistory },
          ],
        },
        { path: rel('', paths.shop.children), ...children },
        { path: rel('', paths.shop.childNew), ...childNew },
        { path: 'my/children/:childId', ...childDetail },
        // 충전은 메뉴 없이 한 가지 일만 (마이페이지 묶음 밖)
        { path: rel('', paths.shop.walletCharge), ...walletCharge },
        { path: rel('', paths.shop.chargeSuccess), ...chargeSuccess },
        { path: rel('', paths.shop.chargeFail), ...chargeFail },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
    {
      path: paths.center.home,
      element: <CenterLayout />,
      HydrateFallback: RouteFallback,
      children: [
        {
          index: true,
          ...page(() =>
            import('@/pages/center/home').then((m) => ({ Component: m.CenterHomePage })),
          ),
        },
        {
          path: rel(paths.center.home, paths.center.store),
          ...page(() =>
            import('@/pages/center/store').then((m) => ({ Component: m.CenterStorePage })),
          ),
        },
        { path: rel(paths.center.home, paths.center.apply), ...centerApply },
        { path: rel(paths.center.home, paths.center.products), ...centerProducts },
        { path: rel(paths.center.home, paths.center.productNew), ...centerProductNew },
        { path: 'products/:productId', ...centerProductDetail },
        { path: rel(paths.center.home, paths.center.orders), ...centerOrders },
        { path: 'orders/:sellerOrderId', ...centerOrderDetail },
        { path: rel(paths.center.home, paths.center.settlements), ...centerSettlements },
        { path: 'settlements/:settlementId', ...centerSettlementDetail },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
    {
      path: paths.admin.home,
      element: <AdminLayout />,
      HydrateFallback: RouteFallback,
      children: [
        { index: true, ...adminHome },
        { path: rel(paths.admin.home, paths.admin.members), ...adminMembers },
        { path: 'members/:memberId', ...adminMemberDetail },
        { path: rel(paths.admin.home, paths.admin.orders), ...adminOrders },
        { path: 'orders/:orderId', ...adminOrderDetail },
        { path: rel(paths.admin.home, paths.admin.products), ...adminProducts },
        { path: rel(paths.admin.home, paths.admin.payments), ...adminPayments },
        { path: 'payments/:paymentId', ...adminPaymentDetail },
        { path: rel(paths.admin.home, paths.admin.sellerApplications), ...adminSellerApplications },
        { path: rel(paths.admin.home, paths.admin.settlements), ...adminSettlements },
        { path: rel(paths.admin.home, paths.admin.settings), ...adminSettings },
        // 상품 기준 데이터: 종류마다 목록 · 만들기 (관리자에만 있다)
        {
          path: rel(paths.admin.home, paths.admin.attributes),
          ...page(() =>
            import('@/pages/admin/catalog-attributes').then((m) => ({
              Component: m.AdminCatalogAttributesPage,
            })),
          ),
        },
        {
          path: rel(paths.admin.home, paths.admin.attributeNew),
          ...page(() =>
            import('@/pages/admin/catalog-attribute-new').then((m) => ({
              Component: m.AdminCatalogAttributeNewPage,
            })),
          ),
        },
        {
          path: 'catalog/attributes/:attributeId',
          ...page(() =>
            import('@/pages/admin/catalog-attribute-detail').then((m) => ({
              Component: m.AdminCatalogAttributeDetailPage,
            })),
          ),
        },
        {
          path: rel(paths.admin.home, paths.admin.measurementItems),
          ...page(() =>
            import('@/pages/admin/catalog-measurement-items').then((m) => ({
              Component: m.AdminCatalogMeasurementItemsPage,
            })),
          ),
        },
        {
          path: rel(paths.admin.home, paths.admin.measurementItemNew),
          ...page(() =>
            import('@/pages/admin/catalog-measurement-item-new').then((m) => ({
              Component: m.AdminCatalogMeasurementItemNewPage,
            })),
          ),
        },
        {
          path: rel(paths.admin.home, paths.admin.productTypes),
          ...page(() =>
            import('@/pages/admin/catalog-product-types').then((m) => ({
              Component: m.AdminCatalogProductTypesPage,
            })),
          ),
        },
        {
          path: rel(paths.admin.home, paths.admin.productTypeNew),
          ...page(() =>
            import('@/pages/admin/catalog-product-type-new').then((m) => ({
              Component: m.AdminCatalogProductTypeNewPage,
            })),
          ),
        },
        {
          path: rel(paths.admin.home, paths.admin.categories),
          ...page(() =>
            import('@/pages/admin/catalog-categories').then((m) => ({
              Component: m.AdminCatalogCategoriesPage,
            })),
          ),
        },
        {
          path: rel(paths.admin.home, paths.admin.categoryNew),
          ...page(() =>
            import('@/pages/admin/catalog-category-new').then((m) => ({
              Component: m.AdminCatalogCategoryNewPage,
            })),
          ),
        },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
    {
      path: paths.console.home,
      // 시연 기능을 끄면 시연 콘솔을 열지 않고 쇼핑 홈으로 보낸다 (설정을 바꾸면 바로 따라간다)
      element: (
        <DemoOnly>
          <ConsoleLayout />
        </DemoOnly>
      ),
      HydrateFallback: RouteFallback,
      children: [
        {
          index: true,
          ...page(() =>
            import('@/pages/console/home').then((m) => ({ Component: m.ConsoleHomePage })),
          ),
        },
        {
          path: rel(paths.console.home, paths.console.connect),
          ...page(() =>
            import('@/pages/console/connect').then((m) => ({ Component: m.ConsoleConnectPage })),
          ),
        },
        {
          path: rel(paths.console.home, paths.console.verify),
          ...page(() =>
            import('@/pages/console/verify').then((m) => ({ Component: m.ConsoleVerifyPage })),
          ),
        },
        { path: rel(paths.console.home, paths.console.children), ...children },
        { path: rel(paths.console.home, paths.console.childNew), ...childNew },
        { path: 'children/:childId', ...childDetail },
        { path: rel(paths.console.home, paths.console.profile), ...profile },
        { path: rel(paths.console.home, paths.console.addresses), ...addresses },
        {
          path: rel(paths.console.home, paths.console.products),
          ...page(() =>
            import('@/pages/console/products').then((m) => ({ Component: m.ConsoleProductsPage })),
          ),
        },
        {
          path: 'products/:productId',
          ...page(() =>
            import('@/pages/console/product-detail').then((m) => ({
              Component: m.ConsoleProductDetailPage,
            })),
          ),
        },
        {
          path: rel(paths.console.home, paths.console.cart),
          ...page(() =>
            import('@/pages/console/cart').then((m) => ({ Component: m.ConsoleCartPage })),
          ),
        },
        {
          path: rel(paths.console.home, paths.console.orders),
          ...page(() =>
            import('@/pages/console/orders').then((m) => ({ Component: m.ConsoleOrdersPage })),
          ),
        },
        {
          path: 'orders/:orderId',
          ...page(() =>
            import('@/pages/console/order-detail').then((m) => ({
              Component: m.ConsoleOrderDetailPage,
            })),
          ),
        },
        { path: rel(paths.console.home, paths.console.wallet), ...wallet },
        { path: rel(paths.console.home, paths.console.walletHistory), ...walletHistory },
        { path: rel(paths.console.home, paths.console.walletCharge), ...walletCharge },
        { path: rel(paths.console.home, paths.console.chargeSuccess), ...chargeSuccess },
        { path: rel(paths.console.home, paths.console.chargeFail), ...chargeFail },
        { path: rel(paths.console.home, paths.console.sellerApply), ...centerApply },
        { path: rel(paths.console.home, paths.console.sellerProducts), ...centerProducts },
        { path: rel(paths.console.home, paths.console.sellerProductNew), ...centerProductNew },
        { path: 'seller/products/:productId', ...centerProductDetail },
        { path: rel(paths.console.home, paths.console.sellerOrders), ...centerOrders },
        { path: 'seller/orders/:sellerOrderId', ...centerOrderDetail },
        { path: rel(paths.console.home, paths.console.sellerSettlements), ...centerSettlements },
        { path: 'seller/settlements/:settlementId', ...centerSettlementDetail },
        {
          path: rel(paths.console.home, paths.console.adminSellerApplications),
          ...adminSellerApplications,
        },
        { path: rel(paths.console.home, paths.console.adminSettlements), ...adminSettlements },
        { path: rel(paths.console.home, paths.console.adminMembers), ...adminMembers },
        { path: 'admin/members/:memberId', ...adminMemberDetail },
        { path: rel(paths.console.home, paths.console.adminOrders), ...adminOrders },
        { path: 'admin/orders/:orderId', ...adminOrderDetail },
        { path: rel(paths.console.home, paths.console.adminProducts), ...adminProducts },
        { path: rel(paths.console.home, paths.console.adminPayments), ...adminPayments },
        { path: 'admin/payments/:paymentId', ...adminPaymentDetail },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ]),
)
