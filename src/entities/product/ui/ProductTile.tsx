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
  /** 누를 때 (예: 검색 결과 클릭 기록). 상세로 가는 이동은 그대로 */
  onClick?: () => void
}

/**
 * 쇼핑 상품 칸 (확정 시안 11-09): 3:4 사진(꼬리표는 사진 왼쪽 아래) · 상점 이름 · 상품명 · 가격.
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
  onClick,
}: ProductTileProps) {
  return (
    <Link to={to} className="group rounded-card block" onClick={onClick}>
      {/* 확정 시안: 홈(브랜드 퍼플)은 둥근 사진, 나머지 화면은 각진 사진 */}
      <div className="rounded-card bg-paper-2 relative overflow-hidden [[data-shop-home]_&]:rounded-[20px]">
        <ProductImage
          src={imageUrl}
          alt={name}
          allowSample
          className="aspect-[3/4] transition-transform duration-300 motion-safe:group-hover:scale-[1.03]"
        />
        {isSoldOut && (
          <span className="bg-ink/45 text-paper absolute inset-0 flex items-center justify-center text-sm font-bold">
            품절
          </span>
        )}
        {tag && (
          <span
            className={cn(
              'absolute bottom-2.5 left-2.5 inline-flex h-[26px] items-center rounded-full px-2.5 text-xs font-bold',
              tag.fit ? 'bg-fit-soft text-fit-ink' : 'bg-paper text-signal',
            )}
          >
            {tag.text}
          </span>
        )}
      </div>
      <div className="mt-2.5 space-y-0.5">
        {seller && <p className="text-ink-3 truncate text-[13px] font-semibold">{seller}</p>}
        <p className="text-ink line-clamp-2 text-sm leading-snug group-hover:underline">{name}</p>
        <p className="figure text-ink pt-0.5 text-[15px] font-bold">
          {price === null ? '—' : formatWon(price)}
        </p>
      </div>
    </Link>
  )
}
