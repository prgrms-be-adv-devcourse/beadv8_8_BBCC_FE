import { useNavigate, useSearchParams } from 'react-router'
import { KakaoCallback, takeLoginReturn } from '@/features/auth-kakao-login'
import { PageHeader } from '@/shared/ui/PageHeader'
import { paths } from '@/shared/config'

export function KakaoCallbackPage() {
  const [search] = useSearchParams()
  const navigate = useNavigate()
  return (
    <div>
      <PageHeader title="카카오 로그인" />
      <KakaoCallback
        code={search.get('code')}
        onSuccess={() => navigate(takeLoginReturn() ?? paths.shop.home, { replace: true })}
      />
    </div>
  )
}
