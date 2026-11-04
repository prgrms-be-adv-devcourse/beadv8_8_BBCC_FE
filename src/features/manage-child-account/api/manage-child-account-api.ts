import { childAccountShape } from '@/entities/child-account'
import { apiClient, expectShape } from '@/shared/api'
import type { ChildAccountRequestDto } from './child-account.dto'
export const manageChildAccountApi = {
  create: (request: ChildAccountRequestDto) =>
    apiClient.post('/auth/child-accounts', request).then(expectShape(childAccountShape)),
  resetPassword: (id: string, password: string) =>
    apiClient.patch<void>(`/auth/child-accounts/${id}/password`, { password }),
  remove: (id: string) => apiClient.delete<void>(`/auth/child-accounts/${id}`),
}
