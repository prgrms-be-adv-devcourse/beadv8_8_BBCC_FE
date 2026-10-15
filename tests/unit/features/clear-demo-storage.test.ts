import { describe, expect, it } from 'vitest'
import { clearDemoStorage } from '@/features/reset-demo/lib/clear-demo-storage'

function memoryStorage(entries: Record<string, string>) {
  const map = new Map(Object.entries(entries))
  return {
    get length() {
      return map.size
    },
    key: (index: number) => [...map.keys()][index] ?? null,
    removeItem: (key: string) => void map.delete(key),
    keys: () => [...map.keys()],
  }
}

describe('시연 초기화: 탭 저장소 정리', () => {
  it('kidly.* 시연 기록만 지우고 시연 역할 · 다른 키는 남긴다', () => {
    const storage = memoryStorage({
      'kidly.mock.products.v2': '[]',
      'kidly.mock.settlement-targets-v2': '[]',
      'kidly.api-flow-log': '[]',
      'kidly.charge-return': '{}',
      'kidly.demo-account': '{"memberId":1}',
      'other.app': 'x',
    })
    expect(clearDemoStorage(storage)).toBe(4)
    expect(storage.keys().sort()).toEqual(['kidly.demo-account', 'other.app'])
  })
})
