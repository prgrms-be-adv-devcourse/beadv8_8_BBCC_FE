/** 빌드 값 문자열을 켜짐 · 꺼짐으로 읽는다. 'false'일 때만 끄고, 없거나 다른 값이면 켠다 */
export function flagOn(value: string | undefined): boolean {
  return value !== 'false'
}

/**
 * 시연 도구(시연 막대 표시 · 시연 콘솔 · API 흐름 · 시연용 문구)를 켤지.
 * VITE_DEMO_TOOLS가 없으면 시연 역할 전환을 따른다: 개발 토큰이 없어 역할 전환을 끈 배포는 시연 도구도 끈다
 */
export function demoToolsOn(value: string | undefined, demoRoleSwitch: boolean): boolean {
  return value ? flagOn(value) : demoRoleSwitch
}
