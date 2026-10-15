import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { formatWon } from '@/shared/lib'
import { Card } from '@/shared/ui/card'

type ProductCardProps = {
  to: string
  name: string
  meta: string
  price: number
  /** 오른쪽 아래 표시 (예: 추천 사이즈 배지) */
  badge?: ReactNode
}

export function ProductCard({ to, name, meta, price, badge }: ProductCardProps) {
  return (
    <Link to={to}>
      <Card className="hover:border-primary space-y-2 transition-colors">
        <div className="bg-muted text-muted-foreground flex aspect-[4/3] items-center justify-center rounded-lg text-xs">
          상품 이미지
        </div>
        <p className="font-medium">{name}</p>
        <p className="text-muted-foreground text-xs">{meta}</p>
        <div className="flex items-center justify-between">
          <span className="font-semibold">{formatWon(price)}</span>
          {badge}
        </div>
      </Card>
    </Link>
  )
}
