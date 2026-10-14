import { useNavigate, useSearchParams } from 'react-router'
import { KakaoCallback } from '@/features/auth-kakao-login'
import { PageHeader } from '@/shared/ui/page-header'

export function KakaoCallbackPage() {
  const [search] = useSearchParams()
  const navigate = useNavigate()
  return (
    <div>
      <PageHeader title="카카오 로그인" />
      <KakaoCallback code={search.get('code')} onSuccess={() => navigate('/', { replace: true })} />
    </div>
  )
}
