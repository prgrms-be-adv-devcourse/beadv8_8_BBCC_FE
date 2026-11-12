import type { ReactNode } from 'react'
import { cn, formatDateTime, formatWon } from '@/shared/lib'
import type { WishRequest, WishRequestLine } from '../model/wish'
import {
  canDecideWish,
  wishDeadlineLabel,
  wishSellersLabel,
  wishTitle,
  wishTotalAmount,
} from '../model/wish.rules'

type WishSummaryCardProps = {
  wish: WishRequest
  /** 상태 꼬리표 문구 (자녀 · 보호자가 다르게 읽는다) */
  statusLabel: string
  /** 상품 사진 (엔티티끼리 import하지 않으므로 화면이 그려 넣는다) */
  renderImage: (line: WishRequestLine) => ReactNode
  /** 맨 위 왼쪽 (보호자 목록: 자녀 이름) */
  leading?: ReactNode
  /** 맨 아래 (철회 버튼 · 답하러 가기) */
  action?: ReactNode
}

/** 조르기 한 건 요약: 상태 · 보낸 때 · 남은 기간 → 사진(여러 개면 +N) · 제목 · 판매자 · 합계 → 메시지 */
export function WishSummaryCard({
  wish,
  statusLabel,
  renderImage,
  leading,
  action,
}: WishSummaryCardProps) {
  const [first, ...rest] = wish.items
  const deadline = wishDeadlineLabel(wish)
  const waiting = canDecideWish(wish)
  const sellers = wishSellersLabel(wish)
  return (
    <article
      className={cn('space-y-3 rounded-lg border p-4', waiting ? 'border-signal' : 'border-rule')}
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        {leading}
        <span
          className={cn(
            'rounded-sm px-2 py-0.5 font-semibold',
            waiting ? 'bg-signal-soft text-signal' : 'bg-paper-2 text-ink-2',
          )}
        >
          {statusLabel}
        </span>
        <span className="text-ink-3 figure">{formatDateTime(wish.requestedAt)}</span>
        {deadline && (
          <span className={cn('ml-auto font-semibold', waiting ? 'text-signal' : 'text-ink-3')}>
            {deadline}
          </span>
        )}
      </div>
      {first && (
        <div className="flex items-center gap-3">
          <div className="flex shrink-0">
            <span className="rounded-card block aspect-square w-14 overflow-hidden">
              {renderImage(first)}
            </span>
            {rest.length > 0 && (
              <span className="bg-paper-3 text-ink-2 rounded-card figure -ml-4 flex aspect-square w-14 items-center justify-center border-2 border-white text-xs font-bold">
                +{rest.length}
              </span>
            )}
          </div>
          <div className="min-w-0 space-y-0.5">
            <p className="text-[15px] font-semibold">{wishTitle(wish)}</p>
            {sellers && <p className="text-ink-3 text-[13px]">{sellers}</p>}
            <p className="figure text-sm font-bold">{formatWon(wishTotalAmount(wish))}</p>
          </div>
        </div>
      )}
      {wish.message && (
        <p className="bg-paper-2 text-ink-2 rounded-md px-3 py-2 text-[13px]">“{wish.message}”</p>
      )}
      {action}
    </article>
  )
}
