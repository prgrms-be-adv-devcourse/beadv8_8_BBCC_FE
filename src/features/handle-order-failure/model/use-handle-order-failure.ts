import { useMutation, useQueryClient } from '@tanstack/react-query'
import { orderOpsKeys } from '@/entities/order-operation'
import { getErrorMessage, runWithAction } from '@/shared/api'
import { toast } from '@/shared/lib'
import { handleOrderFailureApi } from '../api/handle-order-failure-api'

export type OrderFailureAction =
  'retryRecovery' | 'cancelRecovery' | 'retryEventFailure' | 'cancelEventFailure' | 'retryOutbox'

const ACTION_NAME: Record<OrderFailureAction, string> = {
  retryRecovery: '결제 완료 반영 재처리',
  cancelRecovery: '결제 반영 실패 주문 취소',
  retryEventFailure: '받은 이벤트 재처리',
  cancelEventFailure: '받은 이벤트 처리 종료',
  retryOutbox: '격리된 이벤트 다시 보내기',
}

const DONE_TOAST: Record<OrderFailureAction, string> = {
  retryRecovery: '다시 처리했어요 · 결과는 상태에서 확인해요',
  cancelRecovery: '주문을 취소하고 기록을 끝냈어요',
  retryEventFailure: '다시 처리했어요 · 결과는 상태에서 확인해요',
  cancelEventFailure: '기록을 끝냈어요',
  retryOutbox: '다시 보내도록 대기열에 넣었어요',
}

/** 처리 대기 조치 하나. 성공 · 실패 모두 주문 운영 목록 · 건수를 다시 받는다 */
export function useHandleOrderFailure(action: OrderFailureAction, id: string) {
  const client = useQueryClient()
  const refresh = () => client.invalidateQueries({ queryKey: orderOpsKeys.all })
  const mutation = useMutation({
    mutationFn: () => runWithAction(ACTION_NAME[action], () => handleOrderFailureApi[action](id)),
    onSuccess: () => {
      toast(DONE_TOAST[action])
      return refresh()
    },
    // 실패 뒤 다시 받은 목록에서 그 줄이 빠질 수 있어(이미 처리됨 등) detail을 알림으로도 띄운다
    onError: (error) => {
      toast(getErrorMessage(error), { tone: 'error' })
      return refresh()
    },
  })
  return { run: () => mutation.mutate(), pending: mutation.isPending, error: mutation.error }
}
