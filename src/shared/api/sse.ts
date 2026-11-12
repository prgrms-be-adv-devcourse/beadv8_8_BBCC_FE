/** text/event-stream 이벤트 하나. event가 없으면 'message' */
export type SseEvent = { event: string; data: string }

/** 줄 단위 SSE 파서: event · data(여러 줄은 줄바꿈으로 잇는다) · 빈 줄에서 내보냄 · ':' 주석 무시 */
function createSseParser(onEvent: (event: SseEvent) => void) {
  let event = ''
  let data: string[] = []
  let buffer = ''

  const dispatch = () => {
    if (data.length > 0) onEvent({ event: event || 'message', data: data.join('\n') })
    event = ''
    data = []
  }

  const readLine = (line: string) => {
    if (line === '') return dispatch()
    if (line.startsWith(':')) return
    const colon = line.indexOf(':')
    const field = colon === -1 ? line : line.slice(0, colon)
    const value = colon === -1 ? '' : line.slice(colon + 1).replace(/^ /, '')
    if (field === 'event') event = value
    else if (field === 'data') data.push(value)
  }

  return {
    feed(text: string) {
      buffer += text
      const lines = buffer.split(/\r\n|\r|\n/)
      buffer = lines.pop() ?? ''
      lines.forEach(readLine)
    },
    /** 스트림이 정상으로 닫히면 빈 줄 없이 끝난 마지막 이벤트도 내보낸다 */
    end() {
      if (buffer) readLine(buffer)
      buffer = ''
      dispatch()
    },
  }
}

/** 스트림을 닫힐 때까지 읽으며 이벤트마다 onEvent를 부른다. 읽다가 끊기면 오류를 던진다 */
export async function readSse(
  stream: ReadableStream<Uint8Array>,
  onEvent: (event: SseEvent) => void,
): Promise<void> {
  const parser = createSseParser(onEvent)
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    parser.feed(decoder.decode(value, { stream: true }))
  }
  parser.feed(decoder.decode())
  parser.end()
}

/**
 * 스트림을 끝까지 읽어 이벤트 목록을 돌려준다.
 * 읽다가 끊기면 그때까지 다 받은 이벤트를 돌려주고, 하나도 받지 못했으면 오류를 그대로 던진다
 */
export async function readSseEvents(stream: ReadableStream<Uint8Array>): Promise<SseEvent[]> {
  const events: SseEvent[] = []
  try {
    await readSse(stream, (event) => events.push(event))
  } catch (error) {
    if (events.length === 0) throw error
  }
  return events
}
