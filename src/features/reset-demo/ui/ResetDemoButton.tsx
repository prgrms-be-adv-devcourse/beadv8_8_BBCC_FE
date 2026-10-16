import { confirmAction } from '@/shared/lib'
import { paths } from '@/shared/config'
import { Button } from '@/shared/ui/button'
import { clearDemoStorage } from '../lib/clear-demo-storage'

/**
 * 시연을 ①부터 다시: 화면 쪽 시연 기록(목 저장소 · 흐름 기록)을 지우고 콘솔 홈을 새로 불러 메모리 상태도 비운다.
 * 서버 데이터는 지우지 않는다
 */
export function ResetDemoButton() {
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={async () => {
        const ok = await confirmAction({
          title: '시연을 처음부터 다시 할까요?',
          description:
            '지우는 것: 목 데이터(상품 · 정산 등), 흐름 기록\n남는 것: 시연 역할 로그인, 목 설정\n서버(백엔드) 데이터는 그대로예요.',
          confirmLabel: '처음부터',
        })
        if (!ok) return
        try {
          clearDemoStorage(sessionStorage)
        } catch {
          // 저장소를 쓸 수 없으면 새로 불러오기만 한다
        }
        window.location.assign(paths.console.home)
      }}
    >
      시연 초기화
    </Button>
  )
}
