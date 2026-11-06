import type { DeadLetterDto } from '../api/dead-letter.dto'
import type { DeadLetter, DeadLetterStatus } from './dead-letter'

export function toDeadLetter(dto: DeadLetterDto): DeadLetter {
  const { deadLetterId, status, ...rest } = dto
  return { ...rest, id: deadLetterId, status: status as DeadLetterStatus }
}
