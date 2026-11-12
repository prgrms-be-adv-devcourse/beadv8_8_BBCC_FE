import { useQuery } from '@tanstack/react-query'
import { deadLetterApi } from '../api/dead-letter-api'
import { orderDeadLetterApi } from '../api/order-dead-letter-api'
import type { DeadLetterModule } from '../config/dead-letter-modules'
import type { DeadLetterStatus } from './dead-letter'
import { toDeadLetter } from './dead-letter.mapper'
import {
  toOrderDeadLetter,
  toOrderDeadLetterSummary,
  type OrderDeadLetterStatus,
} from './order-dead-letter'

export const deadLetterKeys = {
  all: ['dead-letters'] as const,
  list: (module: DeadLetterModule, status: DeadLetterStatus, page: number) =>
    ['dead-letters', module, 'list', status, page] as const,
  detail: (module: DeadLetterModule, deadLetterId: string) =>
    ['dead-letters', module, 'detail', deadLetterId] as const,
  orderList: (status: OrderDeadLetterStatus, page: number) =>
    ['dead-letters', 'order', 'list', status, page] as const,
  orderDetail: (deadLetterId: string) => ['dead-letters', 'order', 'detail', deadLetterId] as const,
}

export function useDeadLettersQuery(
  module: DeadLetterModule,
  status: DeadLetterStatus,
  page: number,
) {
  return useQuery({
    queryKey: deadLetterKeys.list(module, status, page),
    queryFn: () => deadLetterApi.list(module, status, page),
    select: (result) => ({ ...result, content: result.content.map(toDeadLetter) }),
  })
}

export function useDeadLetterQuery(module: DeadLetterModule, deadLetterId: string) {
  return useQuery({
    queryKey: deadLetterKeys.detail(module, deadLetterId),
    queryFn: () => deadLetterApi.get(module, deadLetterId),
    select: toDeadLetter,
  })
}

export function useOrderDeadLettersQuery(status: OrderDeadLetterStatus, page: number) {
  return useQuery({
    queryKey: deadLetterKeys.orderList(status, page),
    queryFn: () => orderDeadLetterApi.list(status, page),
    select: (result) => ({ ...result, content: result.content.map(toOrderDeadLetterSummary) }),
  })
}

export function useOrderDeadLetterQuery(deadLetterId: string) {
  return useQuery({
    queryKey: deadLetterKeys.orderDetail(deadLetterId),
    queryFn: () => orderDeadLetterApi.get(deadLetterId),
    select: toOrderDeadLetter,
  })
}
