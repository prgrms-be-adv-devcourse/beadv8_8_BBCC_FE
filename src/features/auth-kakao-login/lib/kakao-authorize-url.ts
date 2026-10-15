/**
 * 카카오 인가 화면 주소. Redirect URI는 백엔드 KAKAO_REDIRECT_URI와 같아야 한다.
 * scope를 주면 그 항목만 다시 동의받는다 (예: 이메일 제공을 거절해 가입이 안 됐을 때 account_email)
 */
export function kakaoAuthorizeUrl(clientId: string, redirectUri: string, scope?: string): string {
  const url = new URL('https://kauth.kakao.com/oauth/authorize')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('response_type', 'code')
  if (scope) url.searchParams.set('scope', scope)
  return url.toString()
}

/** 백엔드 EMAIL_REQUIRED(400): 카카오 계정 이메일이 없거나 제공에 동의하지 않아 가입할 수 없다 */
export function isEmailRequired(status: number | null, message: string): boolean {
  return status === 400 && message.includes('이메일')
}
