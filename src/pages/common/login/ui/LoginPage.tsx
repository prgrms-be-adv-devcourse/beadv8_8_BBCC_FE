import { Link, useNavigate, useSearchParams } from 'react-router'
import { KakaoLoginButton } from '@/features/auth-kakao-login'
import { SwitchDemoRole } from '@/features/switch-demo-role'
import { paths, useDemoRoleSwitch } from '@/shared/config'
import { safeReturnPath } from '@/shared/lib'
import { PageHeader } from '@/shared/ui/PageHeader'

export function LoginPage() {
  const [search] = useSearchParams()
  const navigate = useNavigate()
  const demoRoleSwitch = useDemoRoleSwitch()
  // 로그인이 필요한 화면에서 왔으면 로그인 뒤 그 화면으로 돌아간다 (앱 안 주소만)
  const next = safeReturnPath(search.get('next'))

  return (
    <div className="shop-look space-y-4">
      <PageHeader
        title="로그인"
        description="처음 로그인하면 자동으로 가입되고 예치금 지갑이 만들어져요."
      />
      {next && <p className="text-muted-foreground text-sm">로그인하면 보던 화면으로 돌아가요.</p>}
      <div className="border-ink space-y-3 border-[1.5px] p-4">
        <KakaoLoginButton next={next} />
      </div>
      <Link to={paths.child.home} className="text-primary inline-block underline">
        자녀 로그인
      </Link>
      {demoRoleSwitch && (
        <div className="border-ink space-y-2 border-[1.5px] p-4">
          <p className="text-sm font-medium">시연용 로그인 (local 전용 개발용 토큰)</p>
          <SwitchDemoRole onSwitched={() => navigate(next ?? paths.shop.home, { replace: true })} />
        </div>
      )}
    </div>
  )
}
