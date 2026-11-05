import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { useCompleteChildOnboarding } from '../model/use-complete-child-onboarding'

export function ChildOnboarding() {
  const { notice } = useCompleteChildOnboarding()
  return (
    <section className="space-y-4">
      <h1 className="text-section">처음 만나요</h1>
      <p>
        보호자가 너의 이름과 키, 몸무게를 알려 줬어. 알맞은 옷을 추천하고 주문할 때 사용해. 보호자는
        네 계정과 장바구니, 조르기, 주문 내역을 볼 수 있어.
      </p>
      <Button disabled={notice.isPending} onClick={() => notice.mutate()}>
        확인
      </Button>
      {notice.isError && <p role="alert">{getErrorMessage(notice.error)}</p>}
    </section>
  )
}
