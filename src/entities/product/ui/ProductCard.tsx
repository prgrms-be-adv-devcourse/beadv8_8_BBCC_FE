import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { formatWon } from '@/shared/lib'
import { Card } from '@/shared/ui/card'
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
    <Link to={to}>
      <Card className="hover:border-primary space-y-2 transition-colors">
        <ProductImage src={imageUrl} alt={name} className="aspect-[4/3] rounded-lg" />
        <p className="font-medium">{name}</p>
        <p className="text-muted-foreground text-xs">{meta}</p>
        <div className="flex items-center justify-between">
          <span className="font-semibold">{price === null ? '—' : formatWon(price)}</span>
          {badge}
        </div>
      </Card>
    </Link>
  )
}
