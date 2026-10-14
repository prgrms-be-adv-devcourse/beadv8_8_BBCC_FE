import { Link } from 'react-router'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { StateMessage } from '@/shared/ui/page-header'
import { useKakaoLogin } from '../model/use-kakao-login'

export function KakaoCallback({ code, onSuccess }: { code: string | null; onSuccess: () => void }) {
  const login = useKakaoLogin(code, { onSuccess })

  if (!code)
    return <StateMessage tone="error">인가 코드가 없어요. 다시 로그인해 주세요.</StateMessage>
  if (login.isError) {
    return (
      <div className="space-y-2">
        <StateMessage tone="error">{getErrorMessage(login.error)}</StateMessage>
        <Link to={paths.login} className="text-primary underline">
          다시 로그인
        </Link>
      </div>
    )
  }
  return <StateMessage>카카오 계정 확인 중…</StateMessage>
}
