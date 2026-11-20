import { Link } from 'react-router'
import { ProductImage } from '@/entities/product'
import {
  childWishDateLine,
  childWishStatusLabel,
  wishDeadlineLabel,
  wishDeadlineProgress,
  wishRejectReasonLabel,
  wishTotalAmount,
  type WishRequest,
  type WishRequestLine,
  type WishStatus,
} from '@/entities/wish'
import { WithdrawChildWishButton } from '@/features/withdraw-child-wish'
import { paths } from '@/shared/config'
import { cn, formatWon, optionLabel } from '@/shared/lib'

const STAMP_LOOK: Record<WishStatus, string> = {
  REQUESTED: 'bg-paper',
  PAID: 'bg-marker',
  REJECTED: 'bg-sheet',
  EXPIRED: 'bg-paper-3',
  CANCELLED: 'bg-paper-3',
}

const LINK =
  'text-ink flex min-h-11 items-center self-start text-[15px] font-bold underline underline-offset-4'

type ChildWishCardProps = {
  wish: WishRequest
  imageOf: (line: WishRequestLine) => string | null
}

/** 자녀 조르기 한 건: 날짜 · 도장 → 옷 → 내가 쓴 말 · 보호자 답 → 남은 기간과 거두기, 또는 다음에 갈 곳 */
export function ChildWishCard({ wish, imageOf }: ChildWishCardProps) {
  const pieces = wish.items.reduce((sum, line) => sum + line.quantity, 0)
  const progress = wishDeadlineProgress(wish)
  const deadline = wishDeadlineLabel(wish)
  return (
    <article className="border-ink bg-paper flex flex-col gap-3 border-2 p-3.5 md:gap-[18px] md:px-[26px] md:py-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="font-label text-[13px] font-bold tracking-[0.04em]">
            {childWishDateLine(wish)}
          </span>
          <span className="hidden text-sm md:block">
            {pieces}벌 · {formatWon(wishTotalAmount(wish))}
          </span>
        </div>
        <span
          className={cn(
            'border-ink font-display rotate-3 border-2 px-2 py-0.5 text-sm whitespace-nowrap md:border-[2.5px] md:px-3 md:py-1 md:text-lg',
            STAMP_LOOK[wish.status],
          )}
        >
          {childWishStatusLabel(wish)}
        </span>
      </div>

      <ul className="flex flex-col gap-3">
        {wish.items.map((line) => {
          const option = optionLabel(line)
          return (
            <li key={`${line.optionId}-${line.cartItemId}`} className="flex items-center gap-3.5">
              <ProductImage
                src={imageOf(line)}
                alt={line.productName}
                className="bg-paper-2 h-16 w-[52px] shrink-0 object-cover md:h-[90px] md:w-[72px]"
              />
              <div className="flex min-w-0 flex-col gap-1">
                <span className="text-[15px] font-bold md:text-[17px]">{line.productName}</span>
                <span className="text-[13px]">
                  {[option, `${line.quantity}개`].filter(Boolean).join(' · ')}
                </span>
                {line.unitPrice !== null && (
                  <span className="font-display text-base md:text-xl">
                    {formatWon(line.unitPrice * line.quantity)}
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {(wish.message || wish.rejectReason) && (
        <div className="flex flex-col gap-2.5">
          {wish.message && (
            <div className="bg-sheet border-ink max-w-[85%] self-start border-[1.5px] px-3.5 py-1.5">
              <span className="font-label block text-[11px] font-bold tracking-[0.04em]">
                내가 쓴 말
              </span>
              <span className="font-hand text-lg md:text-[21px]">{wish.message}</span>
            </div>
          )}
          {wish.status === 'REJECTED' && wish.rejectReason && (
            <div className="bg-paper border-ink max-w-[90%] self-end border-[1.5px] px-3.5 py-1.5 md:max-w-[85%]">
              <span className="font-label block text-[11px] font-bold tracking-[0.04em]">
                보호자 답
              </span>
              <span className="font-hand text-lg md:text-[21px]">
                {wishRejectReasonLabel(wish.rejectReason)}
              </span>
            </div>
          )}
        </div>
      )}

      {wish.status === 'REQUESTED' && (
        <div className="flex flex-col gap-2">
          {progress && deadline && (
            <>
              <div className="flex justify-between text-[13px] font-bold">
                <span>보호자가 보고 있어</span>
                <span>
                  {progress.totalDays}일 중 {deadline}
                </span>
              </div>
              <div
                role="img"
                aria-label={`조르기 기한 ${progress.totalDays}일 중 ${deadline}`}
                className="border-ink relative h-3 border-2"
              >
                <div
                  className="bg-ink absolute inset-y-0 left-0"
                  style={{ width: `${progress.elapsedPct}%` }}
                />
              </div>
            </>
          )}
          <WithdrawChildWishButton wish={wish} />
        </div>
      )}
      {wish.status === 'PAID' && (
        <Link to={paths.child.purchases} className={LINK}>
          사 준 옷에서 보기 <span aria-hidden>&nbsp;→</span>
        </Link>
      )}
      {(wish.status === 'REJECTED' || wish.status === 'EXPIRED') && (
        <Link to={paths.child.cart} className={LINK}>
          장바구니에서 다시 조르기 <span aria-hidden>&nbsp;→</span>
        </Link>
      )}
    </article>
  )
}
