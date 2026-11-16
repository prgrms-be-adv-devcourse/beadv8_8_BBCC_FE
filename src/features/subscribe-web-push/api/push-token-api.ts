import { apiClient } from '@/shared/api'

const PUSH_TOKEN_PATH = '/notifications/push-tokens'

/**
 * 웹 푸시 기기(FID) 등록 · 해제. 둘 다 회원 로그인 전용이고 204 (BE PushTokenController).
 * 같은 FID를 다시 등록해도 된다 (등록 갱신)
 */
export const pushTokenApi = {
  register: (fid: string) => apiClient.put(PUSH_TOKEN_PATH, { fid }).then(() => undefined),
  remove: (fid: string) =>
    apiClient.delete(PUSH_TOKEN_PATH, { data: { fid } }).then(() => undefined),
}
