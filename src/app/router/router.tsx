import { createBrowserRouter } from 'react-router'
import { HomePage } from '@/pages/home'
import { NotFoundPage } from '@/pages/not-found'
import { RootLayout } from '../layouts/RootLayout'

// 첫 화면만 바로 불러오고, 나머지 화면은 들어갈 때 불러온다 (번들 크기 경고 해소)
export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: 'login',
        lazy: () => import('@/pages/login').then((m) => ({ Component: m.LoginPage })),
      },
      {
        path: 'oauth/kakao/callback',
        lazy: () =>
          import('@/pages/kakao-callback').then((m) => ({ Component: m.KakaoCallbackPage })),
      },
      {
        path: 'children',
        lazy: () => import('@/pages/children').then((m) => ({ Component: m.ChildrenPage })),
      },
      {
        path: 'addresses',
        lazy: () => import('@/pages/addresses').then((m) => ({ Component: m.AddressesPage })),
      },
      {
        path: 'products',
        lazy: () => import('@/pages/products').then((m) => ({ Component: m.ProductsPage })),
      },
      {
        path: 'products/:productId',
        lazy: () =>
          import('@/pages/product-detail').then((m) => ({ Component: m.ProductDetailPage })),
      },
      { path: 'cart', lazy: () => import('@/pages/cart').then((m) => ({ Component: m.CartPage })) },
      {
        path: 'orders',
        lazy: () => import('@/pages/orders').then((m) => ({ Component: m.OrdersPage })),
      },
      {
        path: 'orders/:orderId',
        lazy: () => import('@/pages/order-detail').then((m) => ({ Component: m.OrderDetailPage })),
      },
      {
        path: 'wallet',
        lazy: () => import('@/pages/wallet').then((m) => ({ Component: m.WalletPage })),
      },
      {
        path: 'wallet/charge/success',
        lazy: () =>
          import('@/pages/charge-result').then((m) => ({ Component: m.ChargeSuccessPage })),
      },
      {
        path: 'wallet/charge/fail',
        lazy: () => import('@/pages/charge-result').then((m) => ({ Component: m.ChargeFailPage })),
      },
      {
        path: 'seller/apply',
        lazy: () => import('@/pages/seller-apply').then((m) => ({ Component: m.SellerApplyPage })),
      },
      {
        path: 'seller/products',
        lazy: () =>
          import('@/pages/seller-products').then((m) => ({ Component: m.SellerProductsPage })),
      },
      {
        path: 'seller/orders',
        lazy: () =>
          import('@/pages/seller-orders').then((m) => ({ Component: m.SellerOrdersPage })),
      },
      {
        path: 'seller/settlements',
        lazy: () =>
          import('@/pages/seller-settlements').then((m) => ({
            Component: m.SellerSettlementsPage,
          })),
      },
      {
        path: 'admin/seller-applications',
        lazy: () =>
          import('@/pages/admin-seller-applications').then((m) => ({
            Component: m.AdminSellerApplicationsPage,
          })),
      },
      {
        path: 'admin/settlements',
        lazy: () =>
          import('@/pages/admin-settlements').then((m) => ({ Component: m.AdminSettlementsPage })),
      },
      {
        path: 'verify',
        lazy: () => import('@/pages/verify').then((m) => ({ Component: m.VerifyPage })),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
