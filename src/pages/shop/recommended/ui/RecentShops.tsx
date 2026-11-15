import type { RecentShop } from '@/entities/order'
import { ALL_CATEGORIES_ICON, ProductImage } from '@/entities/product'

type RecentShopsProps = {
  shops: RecentShop[]
}

/** 최근에 산 상점 (맞춤 목록 머리). 상점으로 가는 화면이 아직 없어 보여 주기만 한다 */
export function RecentShops({ shops }: RecentShopsProps) {
  return (
    <section aria-label="최근에 산 상점" className="min-w-0 space-y-2">
      <h2 className="flex flex-wrap items-baseline gap-x-2">
        <span className="font-hand inline-block -rotate-1 text-2xl font-bold">최근에 산 상점</span>
        <span className="text-ink-3 text-xs font-normal">최근 주문 20건 기준</span>
      </h2>
      <ul className="flex gap-2">
        {shops.map((shop) => (
          <li
            key={shop.name}
            className="border-ink flex min-w-0 flex-1 items-center gap-2.5 border-[1.5px] p-2"
          >
            <ProductImage
              src={shop.thumbnailUrl}
              alt=""
              doodle={ALL_CATEGORIES_ICON}
              className="border-ink size-11 shrink-0 border-[1.5px] max-sm:hidden"
            />
            <span className="min-w-0">
              <span className="block truncate text-sm font-extrabold">{shop.name}</span>
              <span className="text-ink-2 block text-xs">최근 주문 {shop.orderCount}건</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
