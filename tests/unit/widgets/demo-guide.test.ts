import { describe, expect, it } from 'vitest'
import { paths } from '@/shared/config'
import { DEMO_GUIDES } from '@/widgets/demo-step-bar/config/guides'
import { findDemoGuide } from '@/widgets/demo-step-bar/model/find-guide'

describe('findDemoGuide: 콘솔 주소 → 시연 안내', () => {
  it('단계 화면은 그 단계 안내를 찾는다', () => {
    expect(findDemoGuide(paths.console.children)?.step).toBe('①')
    expect(findDemoGuide(paths.console.sellerProducts)?.step).toBe('②')
    expect(findDemoGuide(paths.console.adminSettlements)?.step).toBe('⑦')
  })

  it('상세 주소(:id)도 찾는다', () => {
    expect(findDemoGuide(paths.console.product('5'))?.step).toBe('③')
    expect(findDemoGuide(`${paths.console.product('5')}?childId=1`.split('?')[0])?.step).toBe('③')
    expect(findDemoGuide(paths.console.order('12'))?.actor).toBe('보호자')
  })

  it('판매자 등록 · 상세 화면도 그 단계 안내를 찾는다', () => {
    expect(findDemoGuide(paths.console.sellerProductNew)?.step).toBe('②')
    expect(findDemoGuide(paths.console.sellerOrder('4'))?.step).toBe('⑤')
    expect(findDemoGuide(paths.console.sellerSettlement('2'))?.step).toBe('⑦')
  })

  it('끝의 / 는 무시한다', () => {
    expect(findDemoGuide(`${paths.console.cart}/`)?.step).toBe('④')
  })

  it('안내가 없는 화면 · 다른 영역은 null', () => {
    expect(findDemoGuide(paths.console.child('3'))).toBeNull()
    expect(findDemoGuide(paths.shop.cart)).toBeNull()
    expect(findDemoGuide('/console/unknown')).toBeNull()
  })
})

describe('시연 안내 표', () => {
  it('콘솔 홈에서 "다음"을 따라가면 ①~⑦을 순서대로 거쳐 흐름 확인에서 끝난다', () => {
    const steps: string[] = []
    let to: string | null = paths.console.home
    const seen = new Set<string>()
    while (to !== null) {
      expect(seen.has(to), `${to}를 두 번 지남`).toBe(false)
      seen.add(to)
      const guide = findDemoGuide(to)
      expect(guide, `${to}에 안내가 없음`).not.toBeNull()
      steps.push(guide!.step)
      to = guide!.next?.to ?? null
    }
    const numbered = steps.filter((step) => '①②③④⑤⑥⑦'.includes(step))
    expect([...new Set(numbered)]).toEqual(['①', '②', '③', '④', '⑤', '⑥', '⑦'])
    expect([...numbered].sort()).toEqual(numbered)
    expect(seen.has(paths.console.verify)).toBe(true)
  })

  it('모든 안내는 할 일과 볼 것이 있고, 다음 화면에도 안내가 있다', () => {
    for (const { guide } of DEMO_GUIDES) {
      expect(guide.todo.length).toBeGreaterThan(0)
      expect(guide.watch).not.toBe('')
      if (guide.next) expect(findDemoGuide(guide.next.to)).not.toBeNull()
    }
  })
})
