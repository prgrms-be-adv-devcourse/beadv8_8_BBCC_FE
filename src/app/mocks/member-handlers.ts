import type { GrowthRecordDto } from '@/entities/child'
import type { MockHandler } from '@/shared/api'
import { fetchReal, problem } from './mock-utils'

// 기획서 8장 회원 "보완" 중 백엔드에 아직 없는 API (탈퇴 · 성장 이력 수정 · 판매자 정보 수정).
// 서버 데이터는 바꾸지 못하므로 응답만 돌려준다 (다시 조회하면 원래 값)
export const memberHandlers: MockHandler[] = [
  {
    method: 'DELETE',
    path: '/members/me',
    handle: () => ({ status: 204 }),
  },
  {
    method: 'PATCH',
    path: '/children/:childId/growth-records/:recordId',
    handle: async (request) => {
      const records = await fetchReal<GrowthRecordDto[]>(
        request,
        `/children/${request.params.childId}/growth-records`,
      )
      const record = records.find((item) => String(item.id) === request.params.recordId)
      if (!record) {
        return problem(
          404,
          '찾을 수 없습니다',
          '성장 이력을 찾을 수 없습니다.',
          `/api/v1/children/${request.params.childId}/growth-records/${request.params.recordId}`,
        )
      }
      const body = request.body as Partial<GrowthRecordDto>
      return { status: 200, data: { ...record, ...body } }
    },
  },
  {
    method: 'PATCH',
    path: '/seller/me',
    handle: async (request) => {
      const seller = await fetchReal<{ sellerId: number; businessName: string; status: string }>(
        request,
        '/seller/me',
      )
      const body = request.body as { businessName: string }
      return { status: 200, data: { ...seller, businessName: body.businessName } }
    },
  },
]
