type ProductSellerLineProps = {
  /** 판매자 상호명. 없으면 줄을 그리지 않는다 */
  businessName: string | null
}

/** 상품명 위 「[상점 아이콘] 판매자 {상호명}」 */
export function ProductSellerLine({ businessName }: ProductSellerLineProps) {
  if (!businessName) return null
  return (
    <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
      <StoreIcon />
      <span>
        판매자 <span className="text-foreground font-semibold">{businessName}</span>
      </span>
    </p>
  )
}

/** 상점 아이콘 (차양 + 가게, 글자색 대신 primary) */
function StoreIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="text-primary size-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 10v9a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9" />
      <path d="M3 6.5 5 4h14l2 2.5v1a2.5 2.5 0 0 1-4.5 1.5 2.5 2.5 0 0 1-4.5 0 2.5 2.5 0 0 1-4.5 0A2.5 2.5 0 0 1 3 7.5z" />
      <path d="M10 20v-5h4v5" />
    </svg>
  )
}
