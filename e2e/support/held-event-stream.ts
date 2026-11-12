import type { Page } from '@playwright/test'

// SSE를 테스트가 이벤트 단위로 흘려보낸다. Playwright route.fulfill은 본문을 한 번에 보내서
// 「규칙 결과 → AI 대기 → AI 결과」를 흉내 낼 수 없으므로, 페이지의 fetch를 감싸 그 경로만 열린 스트림으로 답한다.
// 테스트가 send로 이벤트를 보내고 close로 닫는다. send는 화면이 스트림을 열 때까지 기다린다. 화면이 끊으면(abort) 스트림도 끊긴다

type HeldStreams = {
  isOpen: () => boolean
  send: (event: string, data: unknown) => void
  close: () => void
}

type HeldStreamWindow = Window & { __heldEventStream?: HeldStreams }

/** 경로(pathname, 예: /api/v1/recommendations/companions)로 가는 fetch를 붙잡는다. 페이지를 열기 전에 부른다 */
export async function holdEventStream(page: Page, pathname: string) {
  await page.addInitScript((target) => {
    const realFetch = window.fetch.bind(window)
    const encoder = new TextEncoder()
    let controllers: ReadableStreamDefaultController<Uint8Array>[] = []
    const streams: HeldStreams = {
      isOpen: () => controllers.length > 0,
      send: (event, data) =>
        controllers.forEach((controller) =>
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)),
        ),
      close: () => {
        controllers.forEach((controller) => controller.close())
        controllers = []
      },
    }
    ;(window as HeldStreamWindow).__heldEventStream = streams
    window.fetch = (input, init) => {
      const request = new Request(input, init)
      if (new URL(request.url).pathname !== target) return realFetch(input, init)
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          controllers.push(controller)
          request.signal.addEventListener('abort', () => {
            // 이미 닫은 스트림은 그대로 둔다
            if (!controllers.includes(controller)) return
            controllers = controllers.filter((item) => item !== controller)
            controller.error(new DOMException('끊었어요', 'AbortError'))
          })
        },
      })
      return Promise.resolve(
        new Response(body, { status: 200, headers: { 'content-type': 'text/event-stream' } }),
      )
    }
  }, pathname)

  const opened = () =>
    page.waitForFunction(() => (window as HeldStreamWindow).__heldEventStream?.isOpen() === true)
  return {
    send: async (event: string, data: unknown) => {
      await opened()
      await page.evaluate(
        ([name, payload]) => (window as HeldStreamWindow).__heldEventStream?.send(name, payload),
        [event, data] as const,
      )
    },
    close: () => page.evaluate(() => (window as HeldStreamWindow).__heldEventStream?.close()),
  }
}
