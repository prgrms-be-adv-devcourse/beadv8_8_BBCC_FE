import { childApi, ageOf } from '@/entities/child'
import type { MockHandler, MockRequest } from '@/shared/api'
import { loadMockState, memberIdOf, problem, saveMockState } from './mock-utils'

type Status = {
  ageGroup: 'UNDER_14' | 'OVER_14'
  noticeConfirmed: boolean
  consented: boolean
  hasProfile: boolean
}
const ONBOARDING_KEY = 'child-onboarding'
const keyOf = (request: MockRequest) => memberIdOf(request) ?? ''
async function statusOf(request: MockRequest): Promise<Status> {
  const current = loadMockState<Record<string, Status>>(ONBOARDING_KEY, {})[keyOf(request)]
  if (current) return current
  const profile = await childApi.own()
  return {
    ageGroup: ageOf(profile.birthDate) < 14 ? 'UNDER_14' : 'OVER_14',
    noticeConfirmed: false,
    consented: false,
    hasProfile: true,
  }
}
async function updateStatus(request: MockRequest, change: Partial<Status>) {
  const states = loadMockState<Record<string, Status>>(ONBOARDING_KEY, {})
  states[keyOf(request)] = { ...(await statusOf(request)), ...change }
  saveMockState(ONBOARDING_KEY, states)
}
// 가정 계약 (childprofile 확정 전)
export const childHandlers: MockHandler[] = [
  {
    method: 'GET',
    path: '/child/onboarding',
    handle: async (request) => ({ status: 200, data: await statusOf(request) }),
  },
  {
    method: 'POST',
    path: '/child/onboarding/notice',
    handle: async (request) => {
      await updateStatus(request, { noticeConfirmed: true })
      return { status: 204 }
    },
  },
  {
    method: 'POST',
    path: '/child/consents',
    handle: async (request) => {
      const status = await statusOf(request)
      const body = request.body as { heightCm: number | null; weightKg: number | null }
      if (!status.hasProfile && (!body.heightCm || !body.weightKg))
        return problem(400, '잘못된 요청', '키와 몸무게를 입력해 주세요.', '/api/v1/child/consents')
      await updateStatus(request, { consented: true })
      return { status: 204 }
    },
  },
]
