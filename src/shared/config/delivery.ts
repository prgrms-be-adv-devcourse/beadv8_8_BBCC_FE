// 주문 · 판매 주문이 함께 쓰는 배송 코드표 (백엔드 Delivery.Status · Carrier)
export type DeliveryStatus = 'READY' | 'SHIPPING' | 'DELIVERED'

export const DELIVERY_STATUS_LABEL: Record<DeliveryStatus, string> = {
  READY: '발송 준비',
  SHIPPING: '배송 중',
  DELIVERED: '배송 완료',
}

export const CARRIERS = [
  { code: 'CJ', name: 'CJ대한통운' },
  { code: 'EPOST', name: '우체국택배' },
  { code: 'HANJIN', name: '한진택배' },
  { code: 'LOTTE', name: '롯데택배' },
  { code: 'LOGEN', name: '로젠택배' },
]

export function carrierName(code: string | null): string {
  return CARRIERS.find((carrier) => carrier.code === code)?.name ?? code ?? '-'
}
