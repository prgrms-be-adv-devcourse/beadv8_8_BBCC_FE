import { appSettingApi, toAppSetting } from '@/entities/app-setting'
import { appSettings } from '@/shared/config'

// 설정을 못 받아도 화면은 떠야 하므로 오래 기다리지 않는다
const TIMEOUT_MS = 3_000

/**
 * 목을 등록하기 전에 BE 설정(목 데이터 사용)을 적용한다.
 * BE 장애 · 시간 초과면 빌드 값(VITE_USE_MOCK, 없으면 켬)을 그대로 쓴다
 */
export async function loadAppSettings() {
  try {
    const dto = await Promise.race([
      appSettingApi.get(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('설정 조회 시간 초과')), TIMEOUT_MS),
      ),
    ])
    appSettings.apply(toAppSetting(dto))
  } catch {
    // 빌드 값 유지
  }
}
