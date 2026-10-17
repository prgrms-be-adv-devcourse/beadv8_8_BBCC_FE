import { useNavigate, useSearchParams } from 'react-router'
import { KakaoLoginButton } from '@/features/auth-kakao-login'
import { SwitchDemoRole } from '@/features/switch-demo-role'
import { paths, useDemoRoleSwitch } from '@/shared/config'
import { safeReturnPath } from '@/shared/lib'
import { Card } from '@/shared/ui/card'
import { PageHeader } from '@/shared/ui/PageHeader'

export function LoginPage() {
  const [search] = useSearchParams()
  const navigate = useNavigate()
  const demoRoleSwitch = useDemoRoleSwitch()
  // 로그인이 필요한 화면에서 왔으면 로그인 뒤 그 화면으로 돌아간다 (앱 안 주소만)
  const next = safeReturnPath(search.get('next'))

  return (
    <div className="space-y-4">
      <PageHeader
        title="로그인"
        description="처음 로그인하면 자동으로 가입되고 예치금 지갑이 만들어져요."
      />
      {next && <p className="text-muted-foreground text-sm">로그인하면 보던 화면으로 돌아가요.</p>}
      <Card className="space-y-3">
        <KakaoLoginButton next={next} />
      </Card>
      {demoRoleSwitch && (
        <Card className="space-y-2">
          <p className="text-sm font-medium">시연용 로그인 (local 전용 개발용 토큰)</p>
          <SwitchDemoRole onSwitched={() => navigate(next ?? paths.shop.home, { replace: true })} />
        </Card>
      )}
    </div>
  )
}
