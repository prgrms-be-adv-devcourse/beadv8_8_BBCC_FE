// 충전 내역 API(GET /charges)는 기획서 보완 단계라 아직 없다.
// 이 탭에서 승인한 충전 ID만 기억해 두고, 상세는 실제 API(GET /wallets/me/charges/{chargeId})로 조회한다
const KEY = 'kidly.recent-charges'

export function rememberCharge(chargeId: string) {
  try {
    const ids = recentChargeIds().filter((id) => id !== chargeId)
    sessionStorage.setItem(KEY, JSON.stringify([chargeId, ...ids].slice(0, 10)))
  } catch {
    // 저장할 수 없으면 기억하지 않는다
  }
}

export function recentChargeIds(): string[] {
  try {
    return (JSON.parse(sessionStorage.getItem(KEY) ?? '[]') as (string | number)[]).map(String)
  } catch {
    return []
  }
}
