import { newRequestKey } from '@/shared/lib'

/** BE #351: 같은 키에 다른 내용을 보냈을 때의 409 title (응답에 오류 코드가 없어 title로 구분) */
export const KEY_REUSED_TITLE = '이미 다른 주문에 쓴 요청입니다'

/**
 * 주문 요청 멱등키를 보내는 내용에 묶는다.
 * 같은 내용으로 다시 보내면 같은 키(재시도 · 응답 유실 → 주문 하나), 내용이 바뀌면 새 키.
 * 주문이 끝나거나(성공) 키가 이미 쓰였다는 409를 받으면 reset으로 버린다
 */
export function createRequestKeyHolder(makeKey: () => string = newRequestKey) {
  let current: { body: string; key: string } | null = null
  return {
    keyFor(request: unknown): string {
      const body = JSON.stringify(request)
      if (current?.body !== body) current = { body, key: makeKey() }
      return current.key
    },
    reset() {
      current = null
    },
  }
}
