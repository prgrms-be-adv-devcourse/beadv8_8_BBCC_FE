import { getErrorMessage, getErrorStatus } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useWebPush } from '../model/use-web-push'
import type { WebPushStatus } from '../model/web-push.rules'

const STATUS_TEXT: Record<Exclude<WebPushStatus, 'off' | 'checking'>, string> = {
  unsupported: '이 브라우저에서는 알림을 받을 수 없어요.',
  denied: '알림이 꺼져 있어요. 브라우저 설정에서 이 사이트의 알림을 허용해 주세요.',
  default: '주문 · 배송 소식을 이 기기로 바로 알려 드릴게요.',
  granted: '이 기기로 알림을 받고 있어요.',
}

/** 서버 응답이 없으면 브라우저 · Firebase 쪽 실패다 (서비스 워커 등록 · FCM 등록) */
function toErrorText(error: Error) {
  return getErrorStatus(error) === null
    ? '이 기기를 알림에 등록하지 못했어요. 잠시 뒤 다시 시도해 주세요.'
    : getErrorMessage(error)
}

/** 알림함 위: 이 기기로 알림 받기. 권한은 버튼을 눌렀을 때만 묻는다. 설정이 없으면 그리지 않는다 */
export function WebPushBanner() {
  const { status, enable } = useWebPush()
  if (status === 'off' || status === 'checking') return null

  return (
    <div className="bg-paper-2 rounded-card space-y-2 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-ink-2 text-sm">{STATUS_TEXT[status]}</p>
        {status === 'default' && (
          <Button size="sm" disabled={enable.isPending} onClick={() => enable.mutate()}>
            {enable.isPending ? '설정 중…' : '알림 받기'}
          </Button>
        )}
      </div>
      {enable.error && <StateMessage tone="error">{toErrorText(enable.error)}</StateMessage>}
    </div>
  )
}
