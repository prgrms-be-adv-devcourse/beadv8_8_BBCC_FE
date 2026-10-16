import { beforeEach, describe, expect, it } from 'vitest'
import { usePanelSize } from '@/widgets/api-flow-panel'

describe('흐름 패널 폭: 상세를 볼 때 잠깐 넓히기', () => {
  beforeEach(() => usePanelSize.setState({ size: 'normal', restoreTo: null }))

  it('보통 폭이면 넓게로 바꾸고, 닫으면 보통으로 돌아간다', () => {
    usePanelSize.getState().widenForDetail()
    expect(usePanelSize.getState().size).toBe('wide')
    usePanelSize.getState().restoreAfterDetail()
    expect(usePanelSize.getState().size).toBe('normal')
  })

  it('직접 고른 폭(넓게 · 전체)은 상세를 닫아도 그대로', () => {
    usePanelSize.getState().setSize('full')
    usePanelSize.getState().widenForDetail()
    usePanelSize.getState().restoreAfterDetail()
    expect(usePanelSize.getState().size).toBe('full')
  })

  it('잠깐 넓힌 사이 사용자가 폭을 고르면 그 폭을 지킨다', () => {
    usePanelSize.getState().widenForDetail()
    usePanelSize.getState().setSize('full')
    usePanelSize.getState().restoreAfterDetail()
    expect(usePanelSize.getState().size).toBe('full')
  })
})
