/** 자녀 조르기 보내기 (가정 계약, BE SendWishRequest에서 childId를 뺀 모양) */
export type SendChildWishRequestDto = { wishItemIds: number[]; message: string | null }
