/** POST /recommendations/product-views (BE ProductViewRequest). childId는 자녀를 골랐을 때만 넣는다 */
export type ProductViewRequestDto = { productId: string; childId?: string }
