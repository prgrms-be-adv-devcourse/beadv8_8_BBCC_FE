import { Link, useNavigate, useParams } from 'react-router'
import { useChildQuery } from '@/entities/child'
import {
  ProductImage,
  lineImageUrl,
  productIdsWithoutImage,
  useProductImageUrls,
} from '@/entities/product'
import {
  canDecideWish,
  guardianWishStatusLabel,
  useWishRequestQuery,
  useWishTimelineQuery,
  wishDeadlineLabel,
  wishLineDecisionLabel,
  wishRejectReasonLabel,
  wishTimelineLabel,
  wishTimelineStatusLabel,
  wishTotalAmount,
  type WishRequestLine,
} from '@/entities/wish'
import { DecideWish } from '@/features/decide-wish'
import { getErrorMessage } from '@/shared/api'
import { memberPathsOf } from '@/shared/config'
import { cn, formatDateTime, formatWon, optionLabel, useArea } from '@/shared/lib'
import { StateMessage } from '@/shared/ui/StateMessage'

/** 조르기 상세: 상태 · 남은 기간 · 메시지 → (대기면) 답하기 / (끝났으면) 상품별 결과 · 주문 → 진행 상황 */
export function ShopChildWishDetailPage() {
  const { requestId = '', childId: routeChildId = '' } = useParams()
  const paths = memberPathsOf(useArea())
  const navigate = useNavigate()
  const wish = useWishRequestQuery(requestId)
  const timeline = useWishTimelineQuery(requestId)
  const child = useChildQuery(wish.data?.childId ?? routeChildId)
  const images = useProductImageUrls(productIdsWithoutImage(wish.data?.items ?? []))
  if (wish.isPending) return <StateMessage>불러오는 중…</StateMessage>
  if (wish.isError) return <StateMessage tone="error">{getErrorMessage(wish.error)}</StateMessage>
  const data = wish.data
  const deadline = wishDeadlineLabel(data)
  const waiting = canDecideWish(data)
  const childName = child.data?.name ?? '아이'
  const renderImage = (line: WishRequestLine) => (
    <ProductImage
      src={lineImageUrl(line, images)}
      alt={line.productName}
      className="size-full object-cover"
    />
  )

  return (
    <div className="shop-look mx-auto max-w-2xl space-y-6">
      <Link
        to={`${paths.wishes}?child=${data.childId}`}
        className="text-ink-3 hover:text-ink inline-flex min-h-8 items-center text-sm font-semibold"
      >
        ‹ 받은 조르기
      </Link>
      <section aria-label="조르기 정보" className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span
            className={cn(
              'rounded-sm px-2 py-0.5 font-semibold',
              waiting ? 'bg-signal-soft text-signal' : 'bg-paper-2 text-ink-2',
            )}
          >
            {guardianWishStatusLabel(data)}
          </span>
          <span className="text-ink-3 figure">{formatDateTime(data.requestedAt)}</span>
          {deadline && (
            <span className={cn('font-semibold', waiting ? 'text-signal' : 'text-ink-3')}>
              {deadline}
              {waiting && data.expiresAt && ` · ${formatDateTime(data.expiresAt)}까지`}
            </span>
          )}
        </div>
        <h1 className="text-page">{childName}의 조르기</h1>
        {data.message && (
          <p className="bg-paper-2 text-ink-2 rounded-md px-3 py-2 text-sm">“{data.message}”</p>
        )}
      </section>

      {waiting ? (
        <DecideWish
          wish={data}
          addressesPath={paths.addresses}
          renderImage={renderImage}
          onApproved={(orderId) => navigate(paths.order(orderId))}
        />
      ) : (
        <section
          aria-label="조른 상품"
          className="border-rule space-y-3 rounded-lg border p-4 md:p-5"
        >
          <h2 className="text-section">조른 상품</h2>
          <ul className="divide-rule divide-y">
            {data.items.map((item) => {
              const decision = wishLineDecisionLabel(data, item)
              const option = optionLabel(item)
              return (
                <li key={item.optionId} className="flex items-start gap-3 py-3">
                  <span className="rounded-card block aspect-square w-16 shrink-0 overflow-hidden">
                    {renderImage(item)}
                  </span>
                  <div className="min-w-0 flex-1 space-y-0.5 text-sm">
                    {item.sellerName && <p className="text-ink-3 text-xs">{item.sellerName}</p>}
                    <p className="font-semibold">{item.productName}</p>
                    <p className="text-ink-2 text-[13px]">
                      {[option, `조른 수량 ${item.quantity}개`].filter(Boolean).join(' · ')}
                    </p>
                    {decision && <p className="text-signal text-xs font-semibold">{decision}</p>}
                  </div>
                </li>
              )
            })}
          </ul>
          <p className="flex justify-between text-sm">
            <span>조른 금액</span>
            <strong className="figure">{formatWon(wishTotalAmount(data))}</strong>
          </p>
          {data.rejectReason && (
            <p className="text-sm">거절 사유: {wishRejectReasonLabel(data.rejectReason)}</p>
          )}
          {data.decidedAt && (
            <p className="text-ink-3 figure text-xs">답한 시각 {formatDateTime(data.decidedAt)}</p>
          )}
          {data.orderIds.map((orderId) => (
            <Link key={orderId} className="shop-link block text-sm" to={paths.order(orderId)}>
              주문 #{orderId} 보기
            </Link>
          ))}
        </section>
      )}

      {timeline.isError && (
        <StateMessage tone="error">{getErrorMessage(timeline.error)}</StateMessage>
      )}
      {timeline.data && (
        <section aria-label="진행 상황" className="space-y-2">
          <h2 className="text-section">진행 상황</h2>
          <ol className="space-y-1 text-sm">
            {timeline.data.steps.map((step) => (
              <li key={step.step} className={step.status === 'DONE' ? 'text-ink' : 'text-ink-3'}>
                {step.status === 'DONE' ? '●' : '○'} {wishTimelineLabel(step.step)} ·{' '}
                {wishTimelineStatusLabel(step.status)} {step.at ? formatDateTime(step.at) : ''}
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  )
}
