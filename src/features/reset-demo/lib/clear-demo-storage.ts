/** 탭 저장소(sessionStorage)에서 지울 시연 기록. 시연 역할(kidly.demo-account)은 남겨 로그인을 유지한다 */
const KEEP = new Set(['kidly.demo-account'])

/** kidly.* 시연 기록을 지우고 지운 키 수를 돌려준다 (목 저장소 · 흐름 기록 · 충전 · 로그인 복귀) */
export function clearDemoStorage(storage: Pick<Storage, 'length' | 'key' | 'removeItem'>): number {
  const keys: string[] = []
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index)
    if (key?.startsWith('kidly.') && !KEEP.has(key)) keys.push(key)
  }
  keys.forEach((key) => storage.removeItem(key))
  return keys.length
}
