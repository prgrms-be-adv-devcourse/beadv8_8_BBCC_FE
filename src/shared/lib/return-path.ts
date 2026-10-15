/** 다른 화면에서 돌아올 주소. 앱 안 주소(/로 시작, //·/\ 아님)만 허용해 외부로 보내지 않는다 */
export function safeReturnPath(raw: string | null | undefined): string | null {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) {
    return null
  }
  return raw
}
