import { verificationError } from './portone.rules'

// 포트원 본인인증 SDK(v2)를 스크립트로 불러온다 (패키지 추가 없이)
declare global {
  interface Window {
    PortOne?: {
      requestIdentityVerification: (options: {
        storeId: string
        channelKey: string
        identityVerificationId: string
      }) => Promise<{ code?: string; message?: string }>
    }
  }
}

const SDK_URL = 'https://cdn.portone.io/v2/browser-sdk.js'

/** 인증창을 열지 못했거나 사용자가 인증을 끝내지 않음 (서버 오류와 따로 보여준다) */
export class VerificationWindowError extends Error {}

function loadSdk(): Promise<void> {
  if (window.PortOne) {
    return Promise.resolve()
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SDK_URL
    script.onload = () => resolve()
    script.onerror = () => reject(new VerificationWindowError('본인인증 창을 불러오지 못했어요.'))
    document.head.appendChild(script)
  })
}

/** 인증창을 열고, 인증을 끝내면 서버가 결과를 다시 조회할 인증 ID를 돌려준다 */
export async function verifyIdentity(storeId: string, channelKey: string): Promise<string> {
  await loadSdk()
  const identityVerificationId = `identity-verification-${crypto.randomUUID()}`
  const result = await window.PortOne!.requestIdentityVerification({
    storeId,
    channelKey,
    identityVerificationId,
  })
  const error = verificationError(result)
  if (error) {
    throw new VerificationWindowError(error)
  }
  return identityVerificationId
}
