import { Link, useSearchParams } from 'react-router'
import { useWalletQuery, validateChargeAmount } from '@/entities/wallet'
import { ChargeForm } from '@/features/charge-wallet'
import { walletPathsOf } from '@/shared/config'
import { safeReturnPath, useArea } from '@/shared/lib'

/** 예치금 충전 (예치금과 따로, 메뉴 없이 가운데 좁은 칸 하나): 뒤로 · 제목 · 충전 폼 */
export function ShopWalletChargePage() {
  const wallet = useWalletQuery()
  const walletPaths = walletPathsOf(useArea())
  // 주문서에서 "충전하고 돌아오기"로 왔으면 금액을 채우고, 승인 뒤 돌아갈 화면을 넘긴다
  const [search] = useSearchParams()
  const requested = Number(search.get('amount'))
  const initialAmount = validateChargeAmount(requested) === null ? requested : undefined
  const returnPath = safeReturnPath(search.get('return'))
  // 돌아가기 문구는 보낸 화면이 정한다 (예: 자동 시연). 없으면 주문서
  const returnLabel = search.get('returnLabel')?.trim().slice(0, 20) || '주문서로 돌아가기'
  const afterCharge = returnPath ? { path: returnPath, label: returnLabel } : null

  return (
    <div className="shop-look mx-auto max-w-md space-y-6">
      <div className="flex items-center gap-1">
        <Link
          to={walletPaths.wallet}
          aria-label="예치금으로 돌아가기"
          className="text-ink hover:bg-paper-2 -ml-2 flex size-10 items-center justify-center rounded-full transition-colors"
        >
          <svg
            viewBox="0 0 24 24"
            className="size-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            aria-hidden
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
        <h1 className="text-lg font-bold">예치금 충전</h1>
      </div>
      <ChargeForm
        key={`${initialAmount ?? ''}-${returnPath ?? ''}`}
        returnTo={{ successPath: walletPaths.chargeSuccess, failPath: walletPaths.chargeFail }}
        initialAmount={initialAmount}
        afterCharge={afterCharge}
        balance={wallet.data?.balance}
      />
    </div>
  )
}
