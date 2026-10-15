import { Link } from 'react-router'
import { getErrorMessage, getErrorStatus } from '@/shared/api'
import { env, paths } from '@/shared/config'
import { StateMessage } from '@/shared/ui/StateMessage'
import { isEmailRequired, kakaoAuthorizeUrl } from '../lib/kakao-authorize-url'
import { useKakaoLogin } from '../model/use-kakao-login'

type KakaoCallbackProps = { code: string | null; onSuccess: () => void }

export function KakaoCallback({ code, onSuccess }: KakaoCallbackProps) {
  const login = useKakaoLogin(code, { onSuccess })

  if (!code)
    return <StateMessage tone="error">인가 코드가 없어요. 다시 로그인해 주세요.</StateMessage>
  if (login.isError) {
    const message = getErrorMessage(login.error)
    return (
      <div className="space-y-2">
        <StateMessage tone="error">{message}</StateMessage>
        {isEmailRequired(getErrorStatus(login.error), message) && env.kakaoClientId && (
          <a
            href={kakaoAuthorizeUrl(env.kakaoClientId, env.kakaoRedirectUri, 'account_email')}
            className="text-primary block font-medium underline"
          >
            이메일 제공에 동의하고 다시 로그인
          </a>
        )}
        <Link to={paths.login} className="text-primary underline">
          다시 로그인
        </Link>
      </div>
    )
  }
  return <StateMessage>카카오 계정 확인 중…</StateMessage>
}
