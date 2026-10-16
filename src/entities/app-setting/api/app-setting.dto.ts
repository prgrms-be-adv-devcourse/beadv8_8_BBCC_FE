/** GET /settings · PUT /admin/settings 응답 (BE AppSettingResponse) */
export type AppSettingDto = {
  useMock: boolean
}

/** PUT /admin/settings 요청 (BE AppSettingRequest) */
export type AppSettingRequestDto = {
  useMock: boolean
}
