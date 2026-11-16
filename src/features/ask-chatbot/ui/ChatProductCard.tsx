import { Link } from 'react-router'
import { formatWon } from '@/shared/lib'
import type { ChatProduct } from '../model/chat'

type ChatProductCardProps = { product: ChatProduct; href: string; onOpen?: () => void }

/** 답 아래 상품 카드: 누르면 상품 상세로 간다. 품절이면 흐리게 표시 */
export function ChatProductCard({ product, href, onOpen }: ChatProductCardProps) {
  return (
    <Link
      to={href}
      onClick={onOpen}
      className="border-rule hover:border-signal flex gap-2 rounded-lg border bg-white p-2 transition-colors"
    >
      <span className="bg-paper-2 relative size-14 shrink-0 overflow-hidden rounded-md">
        {product.thumbnailUrl && (
          <img
            src={product.thumbnailUrl}
            alt=""
            loading="lazy"
            className={
              product.isSoldOut ? 'size-full object-cover opacity-40' : 'size-full object-cover'
            }
          />
        )}
        {product.isSoldOut && (
          <span className="bg-ink absolute inset-x-0 bottom-0 text-center text-[11px] font-bold text-white">
            품절
          </span>
        )}
      </span>
      <span className="min-w-0 space-y-0.5 text-[13px]">
        {product.sellerName && (
          <span className="text-ink-3 block truncate">{product.sellerName}</span>
        )}
        <span className="text-ink line-clamp-2 font-semibold">{product.name}</span>
        <span className="figure text-ink block font-bold">{formatWon(product.price)}</span>
      </span>
    </Link>
  )
}
