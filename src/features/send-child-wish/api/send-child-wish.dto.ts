/** POST /wish/requests (BE SendWishRequest #999). 자녀만 보낸다 */
export type SendChildWishRequestDto = { cartItemIds: number[]; message: string | null }
