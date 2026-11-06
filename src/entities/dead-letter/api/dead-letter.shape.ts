import { nullable, num, obj, oneOf, pageOf, str } from '@/shared/api'

export const deadLetterShape = obj({
  deadLetterId: str,
  status: oneOf(['OPEN', 'REPROCESSED']),
  sourceTopic: str,
  sourcePartition: nullable(num),
  sourceOffset: nullable(num),
  dltTopic: str,
  dltPartition: num,
  dltOffset: num,
  eventType: nullable(str),
  eventId: nullable(str),
  messageKey: nullable(str),
  failureType: nullable(str),
  replayCount: num,
  lastReplayedBy: nullable(str),
  lastReplayedAt: nullable(str),
  lastReplayFailureType: nullable(str),
  createdAt: str,
})

export const deadLetterPageShape = pageOf(deadLetterShape)
