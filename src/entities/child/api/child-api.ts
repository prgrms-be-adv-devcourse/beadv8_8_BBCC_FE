import { apiClient } from '@/shared/api'
import type { ChildProfileDto, ChildProfileRequestDto } from './child.dto'

export const childApi = {
  list: () => apiClient.get<ChildProfileDto[]>('/children').then((response) => response.data),
  get: (childId: string) =>
    apiClient.get<ChildProfileDto>(`/children/${childId}`).then((response) => response.data),
  register: (request: ChildProfileRequestDto) =>
    apiClient.post<ChildProfileDto>('/children', request).then((response) => response.data),
}
