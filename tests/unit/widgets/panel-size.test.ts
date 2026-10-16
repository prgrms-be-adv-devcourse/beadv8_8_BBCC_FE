import { beforeEach, describe, expect, it } from 'vitest'
import { consoleColumns, usePanelSize } from '@/widgets/api-flow-panel'
import { clampPanelWidth } from '@/widgets/api-flow-panel/model/panel-size'

describe('흐름 패널 폭: 상세를 볼 때 잠깐 넓히기', () => {
  beforeEach(() => usePanelSize.setState({ size: 'normal', width: 0, restoreTo: null }))

  it('보통 폭이면 넓게로 바꾸고, 닫으면 보통으로 돌아간다', () => {
    usePanelSize.getState().widenForDetail(440)
    expect(usePanelSize.getState().size).toBe('wide')
    usePanelSize.getState().restoreAfterDetail()
    expect(usePanelSize.getState().size).toBe('normal')
  })

  it('직접 고른 폭(넓게 · 전체)은 상세를 닫아도 그대로', () => {
    usePanelSize.getState().setSize('full')
    usePanelSize.getState().widenForDetail(440)
    usePanelSize.getState().restoreAfterDetail()
    expect(usePanelSize.getState().size).toBe('full')
  })

  it('잠깐 넓힌 사이 사용자가 폭을 고르면 그 폭을 지킨다', () => {
    usePanelSize.getState().widenForDetail(440)
    usePanelSize.getState().setSize('full')
    usePanelSize.getState().restoreAfterDetail()
    expect(usePanelSize.getState().size).toBe('full')
  })

  it('손잡이로 맞춘 폭이 좁으면 잠깐 넓히고, 닫으면 그 폭으로 돌아간다', () => {
    usePanelSize.getState().setWidth(500)
    usePanelSize.getState().widenForDetail(500)
    expect(usePanelSize.getState().size).toBe('wide')
    usePanelSize.getState().restoreAfterDetail()
    expect(usePanelSize.getState()).toMatchObject({ size: 'custom', width: 500 })
  })

  it('패널이 이미 넓으면(목록 | 상세가 나뉨) 폭을 바꾸지 않는다', () => {
    usePanelSize.getState().setWidth(800)
    usePanelSize.getState().widenForDetail(800)
    expect(usePanelSize.getState()).toMatchObject({ size: 'custom', width: 800 })
  })
})

describe('손잡이 폭 계산', () => {
  it('양쪽에 최소 360px을 남긴다', () => {
    expect(clampPanelWidth(100, 1440)).toBe(360)
    expect(clampPanelWidth(1300, 1440)).toBe(1080)
    expect(clampPanelWidth(700.4, 1440)).toBe(700)
  })

  it('직접 맞춘 폭은 그리드 열로, 시연 화면이 360px보다 좁아지지 않게', () => {
    expect(consoleColumns('custom', 700, false)).toBe('1fr 6px min(700px, calc(100% - 360px))')
    expect(consoleColumns('normal', 0, true)).toBe('1fr 6px 560px')
    expect(consoleColumns('full', 0, false)).toBe('0 0 1fr')
  })
})
