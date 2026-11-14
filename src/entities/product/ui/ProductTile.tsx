import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { cn, formatWon } from '@/shared/lib'
import { ALL_CATEGORIES_ICON } from '../config/category-icons'
import { categoryIconOf } from '../model/category-icon.rules'
import { ProductImage } from './ProductImage'

type ProductTileProps = {
  to: string
  name: string
  /** 판매자 상호명. 없으면 줄을 비운다 */
  seller: string | null
  /** 옵션이 없으면 null */
  price: number | null
  /** 대표 이미지 (S3). 없으면 카테고리 낙서 아이콘 */
  imageUrl: string | null
  /** 사진이 없을 때 그릴 아이콘을 고른다. 모르면 옷걸이 */
  categoryName?: string | null
  isSoldOut?: boolean
  /** 사진 왼쪽 위 꼬리표 (예: 「120 잘 맞아요」 · 「사이즈 무관」). fit이면 형광펜 바탕 */
  tag?: { text: string; fit?: boolean }
  /** 누를 때 (예: 검색 결과 클릭 기록). 상세로 가는 이동은 그대로 */
  onClick?: () => void
  /** 사진 오른쪽 아래에 겹쳐 두는 동작 (예: 찜 하트). 링크 밖에 그린다 */
  action?: ReactNode
}

/** 사진 비율. 동작 칸을 사진 위에 겹칠 때도 같은 값을 쓴다 */
const PHOTO_RATIO = 'aspect-[4/5]'

/**
 * 쇼핑 상품 칸: 4:5 각진 사진(꼬리표는 왼쪽 위, 동작은 오른쪽 아래) · 상점 이름 · 상품명 · 가격.
 * 카드 테두리 없이 사진과 글자만 둔다 (ProductCard는 시연 콘솔용)
 */
export function ProductTile({
  to,
  name,
  seller,
  price,
  imageUrl,
  categoryName,
  isSoldOut = false,
  tag,
  onClick,
  action,
}: ProductTileProps) {
  const tile = (
    <Link to={to} className="group block" onClick={onClick}>
      <div className="bg-paper-2 relative overflow-hidden">
        <ProductImage
          src={imageUrl}
          alt={name}
          allowSample
          doodle={(categoryName && categoryIconOf(categoryName)) || ALL_CATEGORIES_ICON}
          className={cn(
            PHOTO_RATIO,
            'transition-transform duration-300 motion-safe:group-hover:scale-[1.04]',
            isSoldOut && 'opacity-45',
          )}
        />
        {isSoldOut && (
          <span className="border-ink bg-paper/85 text-ink font-display absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[14deg] border-[2.5px] px-3.5 py-0.5 text-xl whitespace-nowrap">
            품절
          </span>
        )}
        {tag && (
          <span
            className={cn(
              'border-ink text-ink absolute top-0 left-0 inline-flex h-7 items-center border-r-[1.5px] border-b-[1.5px] px-2 text-xs font-bold',
              tag.fit ? 'bg-marker' : 'bg-paper',
            )}
          >
            {tag.text}
          </span>
        )}
      </div>
      <div className="mt-2.5 space-y-1">
        {seller && <p className="text-ink-3 truncate text-xs">{seller}</p>}
        <p className="text-ink line-clamp-2 text-sm leading-snug font-bold underline-offset-[3px] group-hover:underline">
          {name}
        </p>
        <p className="figure text-ink text-lg leading-tight font-bold">
          {price === null ? '—' : formatWon(price)}
        </p>
      </div>
    </Link>
  )
  if (!action) return tile
  return (
    <div className="relative">
      {tile}
      {/* 사진과 같은 비율의 투명한 판을 겹쳐 사진 오른쪽 아래에 맞춘다 */}
      <div className={cn(PHOTO_RATIO, 'pointer-events-none absolute inset-x-0 top-0')}>
        <div className="pointer-events-auto absolute right-2 bottom-2 flex gap-1.5">{action}</div>
      </div>
    </div>
  )
}
