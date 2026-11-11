import { describe, expect, it } from 'vitest'
import { readSseEvents } from '@/shared/api'

/** 문자열 조각들을 그대로 흘려보내는 스트림 (조각 경계가 줄 · 글자 가운데여도 이어 붙여야 한다) */
function streamOf(chunks: string[], { failAfter }: { failAfter?: number } = {}) {
  const encoder = new TextEncoder()
  let index = 0
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (failAfter !== undefined && index === failAfter) {
        controller.error(new Error('연결이 끊겼습니다'))
        return
      }
      const chunk = chunks[index++]
      if (chunk === undefined) controller.close()
      else controller.enqueue(encoder.encode(chunk))
    },
  })
}

describe('readSseEvents: text/event-stream 읽기', () => {
  it.each([
    [['event: rule\ndata: {"a":1}\n\n'], [{ event: 'rule', data: '{"a":1}' }]],
    [
      ['event: rule\r\ndata: 1\r\n\r\nevent: ai\r\ndata: 2\r\n\r\n'],
      [
        { event: 'rule', data: '1' },
        { event: 'ai', data: '2' },
      ],
    ],
    [['eve', 'nt: ai\nda', 'ta: {"b"', ':2}\n', '\n'], [{ event: 'ai', data: '{"b":2}' }]],
    [['data: 첫 줄\ndata: 둘째 줄\n\n'], [{ event: 'message', data: '첫 줄\n둘째 줄' }]],
    [[': 연결 유지\n\nevent: rule\ndata:x\n\n'], [{ event: 'rule', data: 'x' }]],
    [['event: rule\n\n'], []],
    [['event: ai\ndata: 끝\n'], [{ event: 'ai', data: '끝' }]],
  ])('%j → %j', async (chunks, expected) => {
    expect(await readSseEvents(streamOf(chunks))).toEqual(expected)
  })

  it('읽다가 끊기면 그때까지 받은 이벤트를 돌려준다', async () => {
    const stream = streamOf(['event: rule\ndata: 1\n\n', 'event: ai\nda'], { failAfter: 2 })

    expect(await readSseEvents(stream)).toEqual([{ event: 'rule', data: '1' }])
  })

  it('하나도 받지 못하고 끊기면 실패한다', async () => {
    await expect(readSseEvents(streamOf(['event: ru'], { failAfter: 1 }))).rejects.toThrow(
      '연결이 끊겼습니다',
    )
  })
})
