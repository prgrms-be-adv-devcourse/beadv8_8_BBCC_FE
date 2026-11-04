import { apiClient, arr, expectShape } from '@/shared/api'
import type { ChildAccountDto } from './child-account.dto'
import { childAccountShape } from './child-account.shape'

export const childAccountApi = {
  list: () =>
    apiClient
      .get<ChildAccountDto[]>('/auth/child-accounts')
      .then(expectShape(arr(childAccountShape))),
}
