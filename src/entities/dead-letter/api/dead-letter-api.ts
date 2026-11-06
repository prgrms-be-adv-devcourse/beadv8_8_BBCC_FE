import { apiClient, expectShape, type Page } from '@/shared/api'
import { DEAD_LETTER_MODULES, type DeadLetterModule } from '../config/dead-letter-modules'
import type { DeadLetterDto } from './dead-letter.dto'
import { deadLetterPageShape, deadLetterShape } from './dead-letter.shape'

const pathOf = (module: DeadLetterModule) => DEAD_LETTER_MODULES[module].path

export const deadLetterApi = {
  /** 최근에 받은 것부터 */
  list: (module: DeadLetterModule, status: string, page: number) =>
    apiClient
      .get<Page<DeadLetterDto>>(pathOf(module), { params: { status, page, size: 20 } })
      .then(expectShape(deadLetterPageShape)),
  get: (module: DeadLetterModule, deadLetterId: string) =>
    apiClient
      .get<DeadLetterDto>(`${pathOf(module)}/${deadLetterId}`)
      .then(expectShape(deadLetterShape)),
  /** 처리기가 다시 실패해도 200 (상태는 OPEN 그대로, 실패 예외가 남는다). 이미 재처리 완료면 다시 실행하지 않고 200 */
  reprocess: (module: DeadLetterModule, deadLetterId: string) =>
    apiClient
      .post<DeadLetterDto>(`${pathOf(module)}/${deadLetterId}/reprocess`)
      .then(expectShape(deadLetterShape)),
}
