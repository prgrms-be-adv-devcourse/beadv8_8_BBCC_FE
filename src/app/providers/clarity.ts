// 행동 분석 도구 Microsoft Clarity (클릭 · 스크롤 히트맵, 세션 녹화)
// 공식 설치 코드를 옮긴 것이다. 회원 ID · 닉네임은 보내지 않는다 (identify를 쓰지 않는다)

type ClarityQueue = ((...args: unknown[]) => void) & { q?: unknown[][] }

declare global {
  interface Window {
    clarity?: ClarityQueue
  }
}

let started = false

/** 스크립트를 한 번만 넣는다. 한 번 넣으면 새로고침 전까지 뺄 수 없다 */
export function startClarity(projectId: string) {
  if (started || !projectId) return
  started = true
  const queue: ClarityQueue = (...args) => {
    ;(queue.q ??= []).push(args)
  }
  window.clarity ??= queue
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.clarity.ms/tag/${encodeURIComponent(projectId)}`
  document.head.appendChild(script)
}

/** 이 페이지에 스크립트를 넣었는지 */
export function isClarityStarted() {
  return started
}
