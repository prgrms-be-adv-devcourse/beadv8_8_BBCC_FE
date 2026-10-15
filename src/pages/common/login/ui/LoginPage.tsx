import { KakaoLoginButton } from '@/features/auth-kakao-login'
import { SwitchDemoRole } from '@/features/switch-demo-role'
import { Card } from '@/shared/ui/card'
import { PageHeader } from '@/shared/ui/PageHeader'

export function LoginPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="로그인"
        description="처음 로그인하면 자동으로 가입되고 예치금 지갑이 만들어져요."
      />
      <Card className="space-y-3">
        <KakaoLoginButton />
      </Card>
      <Card className="space-y-2">
        <p className="text-sm font-medium">시연용 로그인 (local 전용 개발용 토큰)</p>
        <SwitchDemoRole />
      </Card>
    </div>
  )
}
