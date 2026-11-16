import { useId } from 'react'
import type { RecentShop } from '@/entities/order'
import { ALL_CATEGORIES_ICON, ProductImage } from '@/entities/product'

type RecentShopsProps = {
  shops: RecentShop[]
}

/** 상점 자리 수. 산 상점이 적어도 구획의 폭이 바뀌지 않게 늘 이만큼 그린다 */
const SLOT_COUNT = 3

/** 최근에 산 상점 (맞춤 목록 머리). 상점으로 가는 화면이 아직 없어 보여 주기만 한다 */
export function RecentShops({ shops }: RecentShopsProps) {
  const noteId = useId()
  const emptySlots = Math.max(0, SLOT_COUNT - shops.length)

  return (
    <section aria-label="최근에 산 상점" className="min-w-0 space-y-2">
      <div className="relative flex w-fit items-center gap-2">
        <h2 className="font-hand inline-block -rotate-1 text-2xl font-bold">최근에 산 상점</h2>
        <button
          type="button"
          aria-label="최근에 산 상점 기준"
          aria-describedby={noteId}
          className="peer border-ink relative grid size-[18px] shrink-0 place-items-center rounded-full border-[1.5px] text-xs leading-none font-bold after:absolute after:-inset-3"
        >
          i
        </button>
        <p
          id={noteId}
          role="tooltip"
          className="bg-ink text-paper invisible absolute top-full left-0 z-10 mt-2 w-64 p-3 text-xs leading-relaxed peer-hover:visible peer-focus:visible sm:top-1/2 sm:left-full sm:mt-0 sm:ml-2 sm:-translate-y-1/2"
        >
          최근 주문 20건 가운데 결제를 마친 주문의 상점을, 많이 산 순서로 {SLOT_COUNT}곳까지 보여
          드려요.
        </p>
      </div>
      <ul className="grid grid-cols-3 gap-2">
        {shops.map((shop) => (
          <li
            key={shop.name}
            className="border-ink flex min-h-[52px] min-w-0 items-center gap-2.5 border-[1.5px] p-2 sm:min-h-[63px]"
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
        {Array.from({ length: emptySlots }, (_, index) => (
          <li
            key={index}
            aria-hidden
            className="bg-paper-2 text-ink-3 grid min-h-[52px] place-items-center sm:min-h-[63px]"
          >
            <StoreIcon />
          </li>
        ))}
      </ul>
    </section>
  )
}

/** 빈 상점 자리에 그리는 가게 그림 */
function StoreIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-6 opacity-60 sm:size-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 10l1.5-5h13L20 10" />
      <path d="M4 10a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0A2.7 2.7 0 0 0 20 10" />
      <path d="M5.5 12.5V20h13v-7.5" />
      <path d="M10 20v-4.5h4V20" />
    </svg>
  )
}
