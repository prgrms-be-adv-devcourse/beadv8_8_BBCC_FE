/** 정산 예정일 표시: 날짜면 그대로, null(공휴일 정보를 못 받음)이면 「예정일 확인 중」 */
export function expectedPayoutLabel(expectedPayoutOn: string | null): string {
  return expectedPayoutOn ?? '예정일 확인 중'
}
