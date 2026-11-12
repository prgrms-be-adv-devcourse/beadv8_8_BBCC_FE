export {
  canDecideWish,
  canRemoveChildCartLine,
  canSendWishLine,
  canWithdrawWish,
  countPendingWishes,
  wishDeadlineLabel,
  wishLineDecisionLabel,
  WISH_REJECT_REASONS,
  wishRejectReasonLabel,
  wishStatusLabel,
  wishTitle,
  wishTimelineLabel,
  wishTimelineStatusLabel,
} from './model/wish.rules'
export type {
  WishStatus,
  WishRequest,
  WishRequestLine,
  WishTimeline,
  WishTimelineStep,
} from './model/wish'
export { toWishRequest, toWishTimeline } from './model/wish.mapper'
export { wishRequestShape } from './api/wish.shape'
export {
  wishKeys,
  useChildWishRequestsQuery,
  useWishRequestsQuery,
  useWishRequestQuery,
  useWishTimelineQuery,
} from './model/queries'

// 단위 테스트 입력용 (tests/unit)
export type { WishRequestDto as MockWishRequestDto } from './api/wish.dto'
