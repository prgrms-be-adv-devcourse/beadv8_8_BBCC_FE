// 토스페이먼츠 결제창 SDK(v2)를 스크립트로 불러온다 (패키지 추가 없이)
type TossPayment = {
  requestPayment: (options: {
    method: 'CARD'
    amount: { currency: 'KRW'; value: number }
    orderId: string
    orderName: string
    successUrl: string
    failUrl: string
  }) => Promise<void>
}

declare global {
  interface Window {
    TossPayments?: (clientKey: string) => {
      payment: (options: { customerKey: string }) => TossPayment
    }
  }
}

const SDK_URL = 'https://js.tosspayments.com/v2/standard'
const ANONYMOUS = '@@ANONYMOUS'

function loadSdk(): Promise<void> {
  if (window.TossPayments) {
    return Promise.resolve()
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SDK_URL
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('토스 결제창을 불러오지 못했어요.'))
    document.head.appendChild(script)
  })
}

// BE failure_code 길이
const MAX_CODE_LENGTH = 50

/** 결제창 오류의 토스 코드 (예: PC에서 창을 닫으면 USER_CANCEL). 코드가 없으면 PAYMENT_WINDOW_ERROR */
export function tossErrorCode(error: unknown): string {
  const code = (error as { code?: unknown } | null)?.code
  return typeof code === 'string' && code ? code.slice(0, MAX_CODE_LENGTH) : 'PAYMENT_WINDOW_ERROR'
}

export async function openTossPayment(
  clientKey: string,
  payment: { orderId: string; amount: number },
  returnTo: { successPath: string; failPath: string },
) {
  await loadSdk()
  const tossPayments = window.TossPayments!(clientKey)
  await tossPayments.payment({ customerKey: ANONYMOUS }).requestPayment({
    method: 'CARD',
    amount: { currency: 'KRW', value: payment.amount },
    orderId: payment.orderId,
    orderName: 'Kidly 예치금 충전',
    successUrl: `${window.location.origin}${returnTo.successPath}`,
    failUrl: `${window.location.origin}${returnTo.failPath}`,
  })
}
