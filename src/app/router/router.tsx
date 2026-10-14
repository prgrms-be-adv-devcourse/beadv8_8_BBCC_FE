import { createBrowserRouter } from 'react-router'
import { AddressesPage } from '@/pages/addresses'
import { AdminSellerApplicationsPage } from '@/pages/admin-seller-applications'
import { AdminSettlementsPage } from '@/pages/admin-settlements'
import { CartPage } from '@/pages/cart'
import { ChargeFailPage, ChargeSuccessPage } from '@/pages/charge-result'
import { ChildrenPage } from '@/pages/children'
import { HomePage } from '@/pages/home'
import { KakaoCallbackPage } from '@/pages/kakao-callback'
import { LoginPage } from '@/pages/login'
import { NotFoundPage } from '@/pages/not-found'
import { OrderDetailPage } from '@/pages/order-detail'
import { OrdersPage } from '@/pages/orders'
import { ProductDetailPage } from '@/pages/product-detail'
import { ProductsPage } from '@/pages/products'
import { SellerApplyPage } from '@/pages/seller-apply'
import { SellerOrdersPage } from '@/pages/seller-orders'
import { SellerProductsPage } from '@/pages/seller-products'
import { SellerSettlementsPage } from '@/pages/seller-settlements'
import { WalletPage } from '@/pages/wallet'
import { RootLayout } from '../layouts/RootLayout'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'oauth/kakao/callback', element: <KakaoCallbackPage /> },
      { path: 'children', element: <ChildrenPage /> },
      { path: 'addresses', element: <AddressesPage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'products/:productId', element: <ProductDetailPage /> },
      { path: 'cart', element: <CartPage /> },
      { path: 'orders', element: <OrdersPage /> },
      { path: 'orders/:orderId', element: <OrderDetailPage /> },
      { path: 'wallet', element: <WalletPage /> },
      { path: 'wallet/charge/success', element: <ChargeSuccessPage /> },
      { path: 'wallet/charge/fail', element: <ChargeFailPage /> },
      { path: 'seller/apply', element: <SellerApplyPage /> },
      { path: 'seller/products', element: <SellerProductsPage /> },
      { path: 'seller/orders', element: <SellerOrdersPage /> },
      { path: 'seller/settlements', element: <SellerSettlementsPage /> },
      { path: 'admin/seller-applications', element: <AdminSellerApplicationsPage /> },
      { path: 'admin/settlements', element: <AdminSettlementsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
