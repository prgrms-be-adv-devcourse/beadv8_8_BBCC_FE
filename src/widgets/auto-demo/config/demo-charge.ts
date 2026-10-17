import { DEMO_PRICE } from '@/features/register-product'
import { paths } from '@/shared/config'

/** 충전하러 갈 때 채울 금액: 시연 4번 분량 */
export const DEMO_CHARGE_AMOUNT = DEMO_PRICE * 4

/** 콘솔 예치금 화면: 금액을 채우고, 충전 뒤 자동 시연(콘솔 처음)으로 돌아오는 링크 */
export function demoChargePath() {
  const search = new URLSearchParams({
    amount: String(DEMO_CHARGE_AMOUNT),
    return: paths.console.home,
    returnLabel: '자동 시연으로 돌아가기',
  })
  return `${paths.console.wallet}?${search}`
}
