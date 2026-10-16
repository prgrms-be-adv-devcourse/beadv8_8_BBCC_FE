import { describe, expect, it, vi } from 'vitest'
import { confirmAction, toast, useConfirmStore, useToastStore } from '@/shared/lib'

describe('확인 모달 (confirmAction)', () => {
  it('확인하면 true, 취소하면 false', async () => {
    const yes = confirmAction({ title: '구매확정할까요?' })
    expect(useConfirmStore.getState().current?.title).toBe('구매확정할까요?')
    useConfirmStore.getState().close(true)
    await expect(yes).resolves.toBe(true)
    expect(useConfirmStore.getState().current).toBeNull()

    const no = confirmAction({ title: '삭제할까요?' })
    useConfirmStore.getState().close(false)
    await expect(no).resolves.toBe(false)
  })
  it('새 확인이 열리면 앞의 것은 취소로 끝난다', async () => {
    const first = confirmAction({ title: '하나' })
    const second = confirmAction({ title: '둘' })
    await expect(first).resolves.toBe(false)
    useConfirmStore.getState().close(true)
    await expect(second).resolves.toBe(true)
  })
})

describe('토스트', () => {
  it('최근 3개까지, 잠시 뒤 사라진다', () => {
    vi.useFakeTimers()
    useToastStore.setState({ toasts: [] })
    for (const message of ['1', '2', '3', '4']) toast(message)
    expect(useToastStore.getState().toasts.map((item) => item.message)).toEqual(['2', '3', '4'])
    expect(useToastStore.getState().toasts[0].tone).toBe('success')
    vi.advanceTimersByTime(4000)
    expect(useToastStore.getState().toasts).toEqual([])
    vi.useRealTimers()
  })
})
