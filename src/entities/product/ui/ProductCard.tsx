import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { formatWon } from '@/shared/lib'
import { ProductImage } from './ProductImage'

type ProductCardProps = {
  to: string
  name: string
  meta: string
  /** 옵션이 없으면 null */
  price: number | null
  /** 대표 이미지 (S3). 없으면 기본 이미지 */
  imageUrl: string | null
  /** 오른쪽 아래 표시 (예: 추천 사이즈 배지) */
  badge?: ReactNode
}

export function ProductCard({ to, name, meta, price, imageUrl, badge }: ProductCardProps) {
  return (
    <Link to={to} className="group block">
      <article className="group-hover:border-primary/40 h-full space-y-2 rounded-2xl border bg-white p-2.5 transition-colors">
        <ProductImage src={imageUrl} alt={name} className="aspect-square rounded-xl" />
        <div className="space-y-1 px-1 pb-1">
          {meta && <p className="text-muted-foreground text-xs">{meta}</p>}
          <p className="line-clamp-2 text-sm font-medium">{name}</p>
          <div className="flex items-center justify-between gap-2">
            <span className="font-extrabold">{price === null ? '—' : formatWon(price)}</span>
            {badge}
          </div>
        </div>
      </article>
    </Link>
  )
}
