/** GET /settings · PUT /admin/settings 응답 (BE AppSettingResponse) */
export type AppSettingDto = {
  useMock: boolean
  demoRoleSwitch: boolean
}

/** PUT /admin/settings 요청 (BE AppSettingRequest). 두 값을 모두 보낸다 */
export type AppSettingRequestDto = {
  useMock: boolean
  demoRoleSwitch: boolean
}
