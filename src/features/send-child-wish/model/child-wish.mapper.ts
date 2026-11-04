import type { SendChildWishRequestDto } from '../api/send-child-wish.dto'
import { wishMessageOrNull } from './child-wish.rules'

export function toChildWishRequest(ids: string[], message: string): SendChildWishRequestDto {
  return { wishItemIds: ids.map(Number), message: wishMessageOrNull(message) }
}
