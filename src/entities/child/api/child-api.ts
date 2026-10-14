import { arr, apiClient, expectShape } from '@/shared/api'
import type { ChildProfileDto, ChildProfileRequestDto } from './child.dto'
import { childShape } from './child.shape'

export const childApi = {
  list: () => apiClient.get<ChildProfileDto[]>('/children').then(expectShape(arr(childShape))),
  get: (childId: string) =>
    apiClient.get<ChildProfileDto>(`/children/${childId}`).then(expectShape(childShape)),
  register: (request: ChildProfileRequestDto) =>
    apiClient.post<ChildProfileDto>('/children', request).then(expectShape(childShape)),
}
