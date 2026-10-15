import { env } from '@/shared/config'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/StateMessage'
import { kakaoAuthorizeUrl } from '../lib/kakao-authorize-url'

/** 카카오 인가 화면으로 이동 → 돌아오면 KakaoCallback이 인가 코드로 로그인한다 */
export function KakaoLoginButton() {
  if (!env.kakaoClientId) {
    return (
      <StateMessage tone="error">
        VITE_KAKAO_CLIENT_ID가 없어 카카오 로그인을 할 수 없어요.
      </StateMessage>
    )
  }
  return (
    <Button asChild size="lg" className="bg-[#FEE500] text-black hover:bg-[#FEE500]/80">
      <a href={kakaoAuthorizeUrl(env.kakaoClientId, env.kakaoRedirectUri)}>카카오로 시작하기</a>
    </Button>
  )
}
