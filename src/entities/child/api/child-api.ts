import { arr, apiClient, expectShape } from '@/shared/api'
import type {
  ChildProfileDto,
  ChildProfileRequestDto,
  GrowthRecordDto,
  GrowthRecordUpdateRequestDto,
} from './child.dto'
import { childShape, growthRecordShape } from './child.shape'

export const childApi = {
  list: () => apiClient.get<ChildProfileDto[]>('/children').then(expectShape(arr(childShape))),
  get: (childId: string) =>
    apiClient.get<ChildProfileDto>(`/children/${childId}`).then(expectShape(childShape)),
  register: (request: ChildProfileRequestDto) =>
    apiClient.post<ChildProfileDto>('/children', request).then(expectShape(childShape)),
  /** 전체 교체. 키 · 체형이 바뀌면 서버가 성장 이력을 1건 쌓는다 */
  update: (childId: string, request: ChildProfileRequestDto) =>
    apiClient.patch<ChildProfileDto>(`/children/${childId}`, request).then(expectShape(childShape)),
  /** 논리 삭제 (목록 · 추천에서 빠짐, 지난 주문은 당시 정보를 복사해 두어 영향 없음) */
  remove: (childId: string) => apiClient.delete(`/children/${childId}`),
  growthRecords: (childId: string) =>
    apiClient
      .get<GrowthRecordDto[]>(`/children/${childId}/growth-records`)
      .then(expectShape(arr(growthRecordShape))),
  /** 기획서 8장 보완. 백엔드에 아직 없어 목 응답이다 */
  updateGrowthRecord: (childId: string, recordId: string, request: GrowthRecordUpdateRequestDto) =>
    apiClient
      .patch<GrowthRecordDto>(`/children/${childId}/growth-records/${recordId}`, request)
      .then(expectShape(growthRecordShape)),
}
