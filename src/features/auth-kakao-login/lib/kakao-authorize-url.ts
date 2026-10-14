/** 카카오 인가 화면 주소. Redirect URI는 백엔드 KAKAO_REDIRECT_URI와 같아야 한다 */
export function kakaoAuthorizeUrl(clientId: string, redirectUri: string): string {
  const url = new URL('https://kauth.kakao.com/oauth/authorize')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('response_type', 'code')
  return url.toString()
}
