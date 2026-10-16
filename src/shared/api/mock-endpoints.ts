/**
 * 엔드포인트별 목 ↔ 실제 전환 (한 곳). BE develop에 API가 머지되면 그 줄의 source만 'real'로 바꾼다.
 * - 'mock': 목 핸들러가 응답한다 (흐름 패널에서 도메인을 끄면 실제 서버로)
 * - 'real': 목 핸들러를 등록하지 않는다 → 늘 실제 서버
 * 화면의 "준비 중(목)" 배지도 이 목록을 출처로 쓴다. 머지 전 PR 기준으로는 바꾸지 않는다
 */
export type EndpointSource = 'mock' | 'real'

export type MockEndpoint = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  /** baseURL(/api/v1) 뒤 경로. :name은 경로 변수 (목 핸들러 path와 같은 글자) */
  path: string
  source: EndpointSource
  /** BE 진행 상황 (확인한 날짜 · 이슈 · PR) */
  backend: string
  /** 쓰는 화면 */
  screens: string
}

export const MOCK_ENDPOINTS: MockEndpoint[] = [
  // 상품
  {
    method: 'GET',
    path: '/products',
    source: 'real',
    backend: 'BE #288 · #291 develop 머지(10/15) → 실제 (FE #93)',
    screens: '쇼핑 홈 · 콘솔 상품 · 관리자 상품(판매 중지)',
  },
  {
    method: 'GET',
    path: '/seller/products',
    source: 'real',
    backend: 'BE SellerProductController develop → 실제 (FE #121)',
    screens: '판매자 상품 · 판매자 센터',
  },
  {
    method: 'GET',
    path: '/seller/products/:productId',
    source: 'real',
    backend: 'BE SellerProductController develop → 실제 (FE #121)',
    screens: '판매자 상품(옵션별 재고)',
  },
  {
    method: 'PATCH',
    path: '/seller/products/:productId',
    source: 'mock',
    backend: 'BE 없음 (수정 도메인 #317만, API 없음)',
    screens: '판매자 상품(수정)',
  },
  {
    method: 'POST',
    path: '/seller/product-images/upload-urls',
    source: 'real',
    backend: 'BE #390 develop 머지(10/16) → 실제 (FE #156)',
    screens: '판매자 상품(등록 · 수정 사진)',
  },
  {
    method: 'PUT',
    path: '/seller/products/:productId/sale-status',
    source: 'real',
    backend: 'BE #336(#315) develop 머지 → 판매 시작 · 중지 실제 (FE #121)',
    screens: '판매자 상품(판매 시작 · 중지)',
  },
  {
    method: 'POST',
    path: '/seller/options/:optionId/inventory-adjustments',
    source: 'real',
    backend: 'BE SellerInventoryController develop → 실제 (FE #121)',
    screens: '판매자 상품(재고 조정)',
  },
  {
    method: 'PUT',
    path: '/admin/products/:productId/sale-status',
    source: 'real',
    backend: 'BE #336(#315) develop 머지 → 실제, 사유 없음 (FE #121)',
    screens: '관리자 상품(판매 중지)',
  },
  // 추천
  {
    method: 'GET',
    path: '/children/:childId/recommended-products',
    source: 'real',
    backend: 'BE #316 develop 머지(10/16) → 실제 (FE #117)',
    screens: '쇼핑 홈 · 콘솔 상품(자녀 맞춤)',
  },
  // 주문
  {
    method: 'GET',
    path: '/orders/:orderId/timeline',
    source: 'mock',
    backend: 'BE #352 계약 확정(10/16), 구현 전 → 주문 상세 · 결제로 만든 목 (FE #124)',
    screens: '주문 상세(처리 과정)',
  },
  // 정산 (BE SellerSettlementController · AdminSettlementController, FE #119). 관리자 정산서 목록 · 재처리는 BE에 없어 화면에서 뺌
  {
    method: 'GET',
    path: '/seller/settlement-targets',
    source: 'real',
    backend: 'BE develop(ca574d3) 머지 → 실제 (FE #119)',
    screens: '판매자 정산',
  },
  {
    method: 'GET',
    path: '/seller/settlements',
    source: 'real',
    backend: 'BE develop(ca574d3) 머지 → 실제 (FE #119)',
    screens: '판매자 정산',
  },
  {
    method: 'GET',
    path: '/seller/settlements/:settlementId',
    source: 'real',
    backend: 'BE develop(ca574d3) 머지 → 실제 (FE #119)',
    screens: '판매자 정산(상세)',
  },
  {
    method: 'POST',
    path: '/admin/settlements/run',
    source: 'real',
    backend: 'BE develop(742516f) 머지 → 실제 (FE #119)',
    screens: '관리자 정산(실행)',
  },
  // 회원 보완
  {
    method: 'DELETE',
    path: '/members/me',
    source: 'mock',
    backend: 'BE 없음',
    screens: '내 정보(탈퇴)',
  },
  {
    method: 'PATCH',
    path: '/children/:childId/growth-records/:recordId',
    source: 'mock',
    backend: 'BE 없음',
    screens: '자녀 상세(성장 이력 수정)',
  },
  {
    method: 'PATCH',
    path: '/seller/me',
    source: 'mock',
    backend: 'BE 없음',
    screens: '판매자 센터(상호명 수정)',
  },
  // 관리자 전체 조회
  {
    method: 'GET',
    path: '/admin/orders',
    source: 'real',
    backend: 'BE #323 develop 머지(10/16) → 실제 (FE #117)',
    screens: '관리자 주문',
  },
  {
    method: 'GET',
    path: '/admin/payments',
    source: 'real',
    backend: 'BE #326 develop 머지(10/16) → 실제 (FE #117)',
    screens: '관리자 결제',
  },
]

export function endpointOf(method: string, path: string): MockEndpoint | undefined {
  return MOCK_ENDPOINTS.find((endpoint) => endpoint.method === method && endpoint.path === path)
}
