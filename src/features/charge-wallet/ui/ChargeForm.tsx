import { useState } from 'react'
import { validateChargeAmount } from '@/entities/wallet'
import { getErrorMessage } from '@/shared/api'
import { env } from '@/shared/config'
import { cn, formatWon } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/StateMessage'
import type { ChargeReturn } from '../lib/charge-return'
import { useRequestCharge } from '../model/use-charge-wallet'

/** 금액 더하기 버튼 (페이 앱의 「+1만원」) */
const QUICK_AMOUNTS = [10_000, 50_000, 100_000, 500_000]
/** 숫자 자판: 마지막 줄은 00 · 0 · 지우기 */
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'back'] as const
/** 자판으로 이보다 큰 수는 만들지 않는다 (검증은 validateChargeAmount) */
const KEYPAD_LIMIT = 99_999_999

type ChargeFormProps = {
  returnTo: { successPath: string; failPath: string }
  /** 처음 채울 금액 (예: 주문서의 부족 금액). 없으면 빈 칸 */
  initialAmount?: number
  /** 충전 승인 뒤 돌아갈 화면 */
  afterCharge?: ChargeReturn | null
  /** 지금 잔액. 있으면 「충전 후 예치금」을 보여 준다 */
  balance?: number
}

/**
 * 예치금 충전 (페이 앱 충전 화면 모양): 결제 수단 → 받는 곳, 가운데 큰 금액,
 * 아래에 더하기 버튼 · 숫자 자판 · 충전 버튼. 금액 칸은 키보드로도 쓴다.
 * returnTo: 토스 결제창에서 돌아올 화면 (영역마다 다르다)
 */
export function ChargeForm({
  returnTo,
  initialAmount,
  afterCharge = null,
  balance,
}: ChargeFormProps) {
  const charge = useRequestCharge(returnTo, afterCharge)
  const [amount, setAmount] = useState(initialAmount ?? 0)
  const invalid = validateChargeAmount(amount)
  const press = (key: (typeof KEYS)[number]) =>
    setAmount((prev) =>
      key === 'back' ? Math.floor(prev / 10) : Math.min(Number(`${prev}${key}`), KEYPAD_LIMIT),
    )

  return (
    <div className="space-y-8">
      {/* 결제 수단 → 받는 곳 */}
      <ol className="space-y-3">
        <li className="flex items-center gap-3">
          <span
            aria-hidden
            className="bg-muted text-foreground flex size-8 items-center justify-center rounded-full text-xs font-bold"
          >
            T
          </span>
          <span className="space-y-0.5">
            <span className="block text-sm font-semibold">토스 테스트 결제</span>
            <span className="text-muted-foreground block text-xs">
              결제 수단, 결제창에서 골라요
            </span>
          </span>
        </li>
        <li className="flex items-center gap-3">
          <span
            aria-hidden
            className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-full text-xs font-bold"
          >
            K
          </span>
          <span className="space-y-0.5">
            <span className="block text-sm font-semibold">Kidly 예치금</span>
            <span className="text-muted-foreground block text-xs">받는 곳</span>
          </span>
        </li>
      </ol>

      {/* 가운데 큰 금액 */}
      <div className="space-y-2 py-6 text-center">
        <label className="sr-only" htmlFor="charge-amount">
          충전 금액 (1천 원 ~ 100만 원)
        </label>
        <div className="flex items-baseline justify-center gap-1">
          <input
            id="charge-amount"
            type="number"
            step={1000}
            inputMode="numeric"
            placeholder="얼마를 충전할까요?"
            className="placeholder:text-muted-foreground/60 figure w-full min-w-0 bg-transparent text-center text-3xl font-bold outline-none placeholder:text-2xl placeholder:font-bold"
            value={amount || ''}
            onChange={(e) => setAmount(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
          />
        </div>
        <p
          className={cn(
            'text-[13px]',
            amount > 0 && invalid ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {amount > 0 && invalid
            ? invalid
            : amount > 0 && balance !== undefined
              ? `충전 후 예치금 ${formatWon(balance + amount)}`
              : '1천 원부터 100만 원까지 충전할 수 있어요'}
        </p>
      </div>

      {/* 더하기 · 숫자 자판 · 충전 */}
      <div className="space-y-3">
        <div className="grid grid-cols-4 gap-1.5">
          {QUICK_AMOUNTS.map((quick) => (
            <button
              key={quick}
              type="button"
              onClick={() => setAmount((prev) => prev + quick)}
              className="bg-muted hover:bg-muted/70 focus-visible:outline-primary h-10 rounded-md text-[13px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 active:translate-y-px"
            >
              +{quick / 10_000}만원
            </button>
          ))}
        </div>
        <div className="border-border grid grid-cols-3 border-t">
          {KEYS.map((key) => (
            <button
              key={key}
              type="button"
              aria-label={key === 'back' ? '한 자리 지우기' : undefined}
              onClick={() => press(key)}
              className="hover:bg-muted focus-visible:outline-primary figure flex h-14 items-center justify-center text-xl font-semibold transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 active:translate-y-px"
            >
              {key === 'back' ? (
                <svg
                  viewBox="0 0 24 24"
                  className="size-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M9 5h11v14H9l-6-7 6-7Z" />
                  <path d="m13 9.5 5 5m0-5-5 5" />
                </svg>
              ) : (
                key
              )}
            </button>
          ))}
        </div>
        <Button
          className="h-14 w-full text-base"
          disabled={invalid !== null || !env.tossClientKey || charge.isPending}
          onClick={() => charge.mutate(amount)}
        >
          {invalid === null ? `${formatWon(amount)} 충전하기` : '충전하기'}
        </Button>
        {afterCharge && (
          <p className="text-muted-foreground text-center text-sm">
            충전이 끝나면 &quot;{afterCharge.label}&quot;를 눌러 돌아갈 수 있어요.
          </p>
        )}
        {!env.tossClientKey && (
          <StateMessage tone="error">
            VITE_TOSS_CLIENT_KEY가 없어 결제창을 열 수 없어요.
          </StateMessage>
        )}
        {charge.isError && (
          <StateMessage tone="error">{getErrorMessage(charge.error)}</StateMessage>
        )}
      </div>
    </div>
  )
}
