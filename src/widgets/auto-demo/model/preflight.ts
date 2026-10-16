/** 자동 시연 시작 전 점검: 서버 · 카테고리 · 시연 계정 · 보호자 예치금 */

export type PreflightState = 'ok' | 'warn' | 'fail'

export type PreflightItem = {
  key: 'server' | 'category' | 'accounts' | 'wallet'
  label: string
  state: PreflightState
  detail: string
}

export type PreflightDeps = {
  /** 카테고리 목록 (서버 연결 확인 겸) */
  categories: () => Promise<{ id: string; name: string }[]>
  /** 시연 계정 이름 → 토큰 받기 */
  accounts: { label: string; issueToken: () => Promise<string> }[]
  /** 보호자 토큰으로 예치금 잔액 */
  walletBalance: (accessToken: string) => Promise<number>
  /** 보호자 계정 이름 */
  guardian: string
  /** 시연 상품 가격 (예치금이 이보다 적으면 ④ 주문 · 결제에서 멈춘다) */
  price: number
  errorMessage: (error: unknown) => string
}

export async function runPreflight(deps: PreflightDeps): Promise<PreflightItem[]> {
  const items: PreflightItem[] = []
  let categories: { id: string; name: string }[] | null = null
  try {
    categories = await deps.categories()
    items.push({ key: 'server', label: '서버 연결', state: 'ok', detail: '응답 받음' })
  } catch (error) {
    items.push({
      key: 'server',
      label: '서버 연결',
      state: 'fail',
      detail: `응답 없음 · ${deps.errorMessage(error)}`,
    })
  }
  if (categories === null) {
    items.push({ key: 'category', label: '카테고리', state: 'fail', detail: '서버 연결부터' })
  } else if (categories.length === 0) {
    items.push({
      key: 'category',
      label: '카테고리',
      state: 'fail',
      detail: '없음 · 백엔드 초기 데이터 필요 (② 상품 등록에서 멈춤)',
    })
  } else {
    items.push({
      key: 'category',
      label: '카테고리',
      state: 'ok',
      detail: `${categories.length}개`,
    })
  }

  const tokens = new Map<string, string>()
  const failed: string[] = []
  for (const account of deps.accounts) {
    try {
      tokens.set(account.label, await account.issueToken())
    } catch (error) {
      failed.push(`${account.label} (${deps.errorMessage(error)})`)
    }
  }
  items.push(
    failed.length === 0
      ? {
          key: 'accounts',
          label: '시연 계정',
          state: 'ok',
          detail: deps.accounts.map((account) => account.label).join(' · '),
        }
      : {
          key: 'accounts',
          label: '시연 계정',
          state: 'fail',
          detail: `발급 실패: ${failed.join(', ')}`,
        },
  )

  const guardianToken = tokens.get(deps.guardian)
  if (!guardianToken) {
    items.push({
      key: 'wallet',
      label: '보호자 예치금',
      state: 'warn',
      detail: '계정이 없어 확인 못 함',
    })
  } else {
    try {
      const balance = await deps.walletBalance(guardianToken)
      const text = `${balance.toLocaleString()}원`
      items.push(
        balance >= deps.price
          ? { key: 'wallet', label: '보호자 예치금', state: 'ok', detail: text }
          : {
              key: 'wallet',
              label: '보호자 예치금',
              state: 'warn',
              detail: `${text} · 시연 상품 ${deps.price.toLocaleString()}원보다 적어요 (④에서 멈춤, 충전 필요)`,
            },
      )
    } catch (error) {
      items.push({
        key: 'wallet',
        label: '보호자 예치금',
        state: 'warn',
        detail: `확인 못 함 · ${deps.errorMessage(error)}`,
      })
    }
  }
  return items
}

/** 막는 항목(fail)이 없으면 바로 시작한다. 경고(warn)는 알리고 진행 */
export const canStart = (items: PreflightItem[]) => items.every((item) => item.state !== 'fail')
