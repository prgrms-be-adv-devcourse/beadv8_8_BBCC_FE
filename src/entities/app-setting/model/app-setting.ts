/** FE 동작 설정 (관리자 화면에서 바꾼다) */
export type AppSetting = {
  /** 백엔드에 없는 API를 목 응답으로 대신한다 */
  isMockEnabled: boolean
  /** 시연 역할 전환 · 시연 콘솔 · API 흐름을 보여 준다 */
  isDemoRoleSwitchEnabled: boolean
}
