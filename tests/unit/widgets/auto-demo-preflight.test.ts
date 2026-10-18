import { describe, expect, it } from 'vitest'
import { canStart, runPreflight, type PreflightDeps } from '@/widgets/auto-demo/model/preflight'
import { scaleWait, SHOW_MS } from '@/widgets/auto-demo/model/run-auto-demo'
import { DEMO_CHARGE_AMOUNT, demoChargePath } from '@/widgets/auto-demo/config/demo-charge'

const deps = (patch: Partial<PreflightDeps> = {}): PreflightDeps => ({
  categories: async () => [{ id: '1', name: '상의' }],
  accounts: [
    { label: '보호자', issueToken: async () => 'g' },
    { label: '판매자', issueToken: async () => 's' },
  ],
  walletBalance: async () => 100_000,
  guardian: '보호자',
  price: 25_000,
  errorMessage: (error) => (error instanceof Error ? error.message : String(error)),
  ...patch,
})

const byKey = (items: Awaited<ReturnType<typeof runPreflight>>) =>
  Object.fromEntries(items.map((item) => [item.key, item.state]))

describe('자동 시연 시작 전 점검', () => {
  it('모두 정상이면 바로 시작한다', async () => {
    const items = await runPreflight(deps())
    expect(byKey(items)).toEqual({ server: 'ok', category: 'ok', accounts: 'ok', wallet: 'ok' })
    expect(canStart(items)).toBe(true)
  })

  it('서버가 응답하지 않으면 서버 · 카테고리가 막힌다', async () => {
    const items = await runPreflight(
      deps({
        categories: async () => {
          throw new Error('Network Error')
        },
      }),
    )
    expect(byKey(items)).toMatchObject({ server: 'fail', category: 'fail' })
    expect(items[0].detail).toContain('Network Error')
    expect(canStart(items)).toBe(false)
  })

  it('카테고리가 비어 있으면 막고 백엔드 초기 데이터를 안내한다', async () => {
    const items = await runPreflight(deps({ categories: async () => [] }))
    expect(items.find((item) => item.key === 'category')).toMatchObject({
      state: 'fail',
      detail: expect.stringContaining('초기 데이터'),
    })
    expect(canStart(items)).toBe(false)
  })

  it('토큰을 못 받은 계정을 이름으로 알린다', async () => {
    const items = await runPreflight(
      deps({
        accounts: [
          { label: '보호자', issueToken: async () => 'g' },
          {
            label: '판매자',
            issueToken: async () => {
              throw new Error('403')
            },
          },
        ],
      }),
    )
    expect(items.find((item) => item.key === 'accounts')?.detail).toBe('발급 실패: 판매자 (403)')
    expect(canStart(items)).toBe(false)
  })

  it('예치금이 상품값보다 적으면 시작을 막고 충전 조치를 단다 (충전은 토스 결제창이라 자동 불가)', async () => {
    let usedToken = ''
    const items = await runPreflight(
      deps({
        walletBalance: async (token) => {
          usedToken = token
          return 10_000
        },
      }),
    )
    expect(usedToken).toBe('g')
    expect(items.find((item) => item.key === 'wallet')).toMatchObject({
      state: 'fail',
      action: 'charge',
      detail: expect.stringContaining('10,000원'),
    })
    expect(canStart(items)).toBe(false)
  })

  it('예치금을 확인하지 못하면 경고만 하고 시작은 한다', async () => {
    const items = await runPreflight(
      deps({
        walletBalance: async () => {
          throw new Error('500')
        },
      }),
    )
    expect(items.find((item) => item.key === 'wallet')?.state).toBe('warn')
    expect(canStart(items)).toBe(true)
  })
})

describe('충전하러 가기', () => {
  it('콘솔 예치금 화면에 시연 4번 분량 금액과 돌아올 곳을 담는다', () => {
    const url = new URL(demoChargePath(), 'http://x')
    expect(url.pathname).toBe('/console/wallet')
    expect(url.searchParams.get('amount')).toBe(String(DEMO_CHARGE_AMOUNT))
    expect(DEMO_CHARGE_AMOUNT).toBe(100_000)
    expect(url.searchParams.get('return')).toBe('/console')
    expect(url.searchParams.get('returnLabel')).toBe('자동 시연으로 돌아가기')
  })
})

describe('자동 시연 속도', () => {
  it('느릴수록 화면을 오래 보여 준다', () => {
    expect(SHOW_MS.slow).toBeGreaterThan(SHOW_MS.present)
    expect(SHOW_MS.present).toBeGreaterThan(SHOW_MS.quick)
    expect(SHOW_MS.quick).toBeGreaterThan(SHOW_MS.test)
  })

  it('단계 안 기다림도 속도에 맞춘다', () => {
    expect(scaleWait('test', 1000)).toBe(300)
    expect(scaleWait('quick', 1000)).toBe(600)
    expect(scaleWait('present', 1000)).toBe(1000)
    expect(scaleWait('slow', 1000)).toBe(1500)
  })
})
