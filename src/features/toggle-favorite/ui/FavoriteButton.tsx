import { Link } from 'react-router'
import { canToggleFavorite } from '@/entities/favorite'
import { cn } from '@/shared/lib'
import { useToggleFavorite } from '../model/use-toggle-favorite'

type FavoriteButtonProps = {
  productId: string
  isFavorited: boolean
  /** 찜 수. 아직 모르면 undefined (숫자를 그리지 않는다) */
  count?: number
  /** 판매 중인지. 아니면 찜할 수 없다 (이미 찜한 것은 뺄 수 있다) */
  isSelling: boolean
  /** 로그인 전이면 로그인 주소. 누르면 그리로 간다 */
  loginHref?: string | null
  /** 상품 목록 칸 위에 겹쳐 둘 작은 원형 하트 (찜 수 없음) */
  isCompact?: boolean
  className?: string
}

const BOX =
  'border-rule text-ink-2 inline-flex min-h-12 min-w-12 flex-none flex-col items-center justify-center gap-0.5 rounded-md border bg-transparent px-1.5 py-1 transition-colors'
const COMPACT_BOX =
  'bg-paper/90 text-ink-2 inline-flex size-10 items-center justify-center rounded-full shadow-sm backdrop-blur transition-colors'

function Heart({ isFilled }: { isFilled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-[22px]"
      fill={isFilled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 20s-7-4.4-9.2-8.6C1.4 8.6 3.2 5 6.6 5c2 0 3.4 1.1 5.4 3 2-1.9 3.4-3 5.4-3 3.4 0 5.2 3.6 3.8 6.4C19 15.6 12 20 12 20Z" />
    </svg>
  )
}

/** 하트 + 찜 수. 누르면 찜하기 · 찜 취소 */
export function FavoriteButton({
  productId,
  isFavorited,
  count,
  isSelling,
  loginHref,
  isCompact = false,
  className,
}: FavoriteButtonProps) {
  const toggle = useToggleFavorite(productId)
  const box = isCompact ? COMPACT_BOX : BOX
  const countLabel =
    count === undefined || isCompact ? null : (
      <span className="figure text-[11px] font-semibold">{count}</span>
    )

  if (loginHref)
    return (
      <Link
        to={loginHref}
        aria-label={`로그인하고 찜하기${count === undefined ? '' : `, 찜 ${count}`}`}
        className={cn(box, 'hover:text-ink', className)}
      >
        <Heart isFilled={false} />
        {countLabel}
      </Link>
    )

  const canToggle = canToggleFavorite({ isFavorited, isSelling })
  // 요청 중에는 누른 결과를 먼저 보여 준다 (끝나면 다시 부른 값으로)
  const isShownFavorited = toggle.isPending ? toggle.variables : isFavorited
  return (
    <button
      type="button"
      aria-pressed={isShownFavorited}
      aria-label={isFavorited ? '찜 취소' : '찜하기'}
      title={canToggle ? undefined : '판매가 끝난 상품은 찜할 수 없어요'}
      disabled={!canToggle || toggle.isPending}
      onClick={() => toggle.mutate(!isFavorited)}
      className={cn(
        box,
        isShownFavorited ? 'text-primary' : 'hover:text-ink',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
    >
      <Heart isFilled={isShownFavorited} />
      {countLabel}
    </button>
  )
}
