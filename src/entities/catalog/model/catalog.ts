// 상품 기준 데이터: 판매자가 상품을 등록할 때 고르는 실측 항목 (관리자가 만든다)

export type MeasurementItem = { id: string; name: string; code: string; unit: string }

export type MeasurementItemForm = { name: string; code: string; unit: string }
