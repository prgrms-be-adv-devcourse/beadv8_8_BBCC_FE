import { Link } from 'react-router'
import { cn, formatWon } from '@/shared/lib'
import { ProductImage } from './ProductImage'

type ProductTileProps = {
  to: string
  name: string
  /** 판매자 상호명. 없으면 줄을 비운다 */
  seller: string | null
  /** 옵션이 없으면 null */
  price: number | null
  /** 대표 이미지 (S3). 없으면 기본 이미지 */
  imageUrl: string | null
  isSoldOut?: boolean
  /** 가격 아래 작은 꼬리표 (예: 「120 잘 맞아요」 · 「사이즈 무관」). fit이면 코랄 */
  tag?: { text: string; fit?: boolean }
}

/**
 * 쇼핑 상품 칸 (셀러 마켓 모양): 사진 · 상점 이름(굵게) · 상품명 · 가격 · 꼬리표.
 * 카드 테두리 없이 사진과 글자만 둔다 (ProductCard는 시연 콘솔용)
 */
export function ProductTile({
  to,
  name,
  seller,
  price,
  imageUrl,
  isSoldOut = false,
  tag,
}: ProductTileProps) {
  return (
    <Link to={to} className="group rounded-card block">
      <div className="rounded-card bg-paper-2 relative overflow-hidden">
        <ProductImage
          src={imageUrl}
          alt={name}
          className="aspect-[3/4] transition-transform duration-300 motion-safe:group-hover:scale-[1.03]"
        />
        {isSoldOut && (
          <span className="bg-ink/45 text-paper absolute inset-0 flex items-center justify-center text-sm font-bold">
            품절
          </span>
        )}
      </div>
      <div className="mt-2.5 space-y-0.5">
        {seller && <p className="text-ink truncate text-[13px] font-bold">{seller}</p>}
        <p className="text-ink-2 line-clamp-2 text-[13px] leading-snug group-hover:underline">
          {name}
        </p>
        <p className="figure text-ink pt-1 text-base font-bold">
          {price === null ? '—' : formatWon(price)}
        </p>
        {tag && (
          <p className="pt-1">
            <span
              className={cn(
                'inline-flex h-5 items-center rounded-sm px-1.5 text-[11px] font-semibold',
                tag.fit ? 'bg-fit-soft text-fit-ink font-bold' : 'bg-paper-2 text-ink-2',
              )}
            >
              {tag.text}
            </span>
          </p>
        )}
      </div>
    </Link>
  )
}
