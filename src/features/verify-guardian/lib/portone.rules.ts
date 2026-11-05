/** 인증창 결과에 code가 있으면 실패 · 취소다. 실패면 보여줄 문구, 성공이면 null */
export function verificationError(result: { code?: string; message?: string }): string | null {
  return result.code === undefined ? null : result.message || '본인인증을 완료하지 못했어요.'
}
