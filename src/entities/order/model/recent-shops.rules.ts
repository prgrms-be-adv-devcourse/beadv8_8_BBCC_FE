import type { OrderSummary } from './order'

/** 최근 주문에서 센 상점 하나. 사진은 그 상점에서 가장 최근에 산 대표 상품의 것 */
export type RecentShop = {
  name: string
  orderCount: number
  thumbnailUrl: string | null
}

/**
 * 최근 주문(최신순)의 대표 상점을 세어 많이 산 순서로 준다. 주문 수가 같으면 더 최근에 산 상점이 앞이다.
 * 가장 많이 산 상점부터 limit개까지만 준다.
 * 주문 목록은 대표 상품의 상점만 알려 주므로, 한 주문에 상점이 여럿이어도 하나만 센다
 */
export function recentShopsOf(orders: OrderSummary[], limit = 3): RecentShop[] {
  const shops = new Map<string, RecentShop>()
  for (const order of orders) {
    // 결제를 마친 주문만 산 것으로 센다
    if (order.status !== 'PAID' || !order.sellerName) continue
    const shop = shops.get(order.sellerName)
    if (shop) {
      shop.orderCount += 1
      shop.thumbnailUrl ??= order.thumbnailUrl
      continue
    }
    shops.set(order.sellerName, {
      name: order.sellerName,
      orderCount: 1,
      thumbnailUrl: order.thumbnailUrl,
    })
  }
  // Map은 처음 넣은 순서(= 최근 순서)를 지키고 sort는 안정 정렬이라 동률은 최근 순서 그대로다
  return [...shops.values()].sort((a, b) => b.orderCount - a.orderCount).slice(0, limit)
}
