import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { useChildCartQuery } from '@/entities/cart'
import { ageOf, sizeRulerOf, SizeRulerBar, useOwnChildProfileQuery } from '@/entities/child'
import { useFavoritedIdsQuery } from '@/entities/favorite'
import { useChildPurchasesQuery } from '@/entities/order'
import { ProductTile, useProductsQuery } from '@/entities/product'
import { SELF_TARGET, useHomePreviewQuery } from '@/entities/recommendation'
import {
  canDecideWish,
  canSendWishLine,
  soonestWishDeadlineLabel,
  useChildWishRequestsQuery,
} from '@/entities/wish'
import { FavoriteButton } from '@/features/toggle-favorite'
import { getErrorMessage, getErrorStatus } from '@/shared/api'
import { paths } from '@/shared/config'
import { cn } from '@/shared/lib'
import { CardGridSkeleton } from '@/shared/ui/Skeleton'
import { StateMessage } from '@/shared/ui/StateMessage'

const CONTAINER = 'max-w-shop mx-auto w-full px-4 md:px-8'
const ROW_SIZE = 4

/** 내 옷장 아래 상품 줄 한 칸: 맞춤이면 「120 잘 맞아요」 꼬리표가 붙는다 */
type RowProduct = {
  id: string
  name: string
  businessName: string | null
  minPrice: number | null
  imageUrl: string | null
  isSoldOut: boolean
  tag?: { text: string; fit?: boolean }
}

type TileProps = {
  to: string
  label: string
  count: number | undefined
  unit: string
  hint: ReactNode
  cta: string
  shortCta: string
  isMarked?: boolean
}

/** 큰 숫자 칸: 휴대폰은 숫자와 짧은 안내만 */
function Tile({ to, label, count, unit, hint, cta, shortCta, isMarked }: TileProps) {
  return (
    <Link
      to={to}
      className={cn(
        'border-ink text-ink flex flex-col gap-0.5 border-2 px-2.5 py-3 transition-[translate,box-shadow] duration-150 md:gap-2.5 md:p-7',
        'motion-safe:hover:-translate-x-[3px] motion-safe:hover:-translate-y-[3px] motion-safe:hover:shadow-[6px_6px_0_var(--shop-ink)]',
        isMarked ? 'bg-marker' : 'bg-paper',
      )}
    >
      <span className="font-label text-[11px] font-bold tracking-[0.04em] md:text-[13px]">
        {label}
      </span>
      <span className="font-display text-[40px] leading-none md:text-[88px] md:leading-[0.95]">
        {count ?? '–'}
        <span className="ml-1.5 hidden text-[30px] md:inline">{unit}</span>
      </span>
      <span className="hidden text-[15px] md:block">{hint}</span>
      <span className="text-xs font-bold md:mt-1.5 md:text-[15px]">
        <span className="md:hidden">{shortCta}</span>
        <span className="hidden md:inline">{cta}</span>
        <span aria-hidden> →</span>
      </span>
    </Link>
  )
}

/** 자녀 첫 화면 (내 옷장): 인사 · 키 눈금자 → 조를 수 있는 옷 · 조르는 중 · 사 준 옷 → 새로 들어온 옷 */
export function ChildProfilePage() {
  const profile = useOwnChildProfileQuery()
  const cart = useChildCartQuery()
  const wishes = useChildWishRequestsQuery()
  const purchases = useChildPurchasesQuery(0)
  // 맞춤 맛보기(자녀 토큰, BE #1639)를 먼저 부른다. 어떤 오류든(배포 전 · 403 · 404 · 서버 오류) 맞는 옷이 없으면
  // 안내 없이 공개 상품 목록의 「새로 들어온 옷」으로 바꾼다
  const fitPicks = useHomePreviewQuery(SELF_TARGET)
  const fitProducts = fitPicks.data?.products ?? []
  const showsNewArrivals =
    fitPicks.isError || (fitPicks.isSuccess && !fitPicks.isFetching && fitProducts.length === 0)
  const newArrivals = useProductsQuery(undefined, 0, { enabled: showsNewArrivals })
  const row: RowProduct[] = showsNewArrivals
    ? (newArrivals.data?.content.slice(0, ROW_SIZE) ?? []).map((product) => ({
        ...product,
        isSoldOut: product.soldOut,
      }))
    : fitProducts.map((product) => ({
        ...product,
        isSoldOut: false,
        tag: product.recommendedSize
          ? { text: `${product.recommendedSize} 잘 맞아요`, fit: true }
          : { text: '사이즈 무관' },
      }))
  const isRowPending = showsNewArrivals ? newArrivals.isPending : fitPicks.isPending
  const favorited = useFavoritedIdsQuery(
    row.map((product) => product.id),
    { owner: 'child' },
  )

  const child = profile.data
  const ruler = child ? sizeRulerOf(child.heightCm) : null
  const cartLines = cart.data?.lines
  const sendableCount = cartLines?.filter(canSendWishLine).length
  const waiting = wishes.data?.filter(canDecideWish)
  const soonest = wishes.data ? soonestWishDeadlineLabel(wishes.data) : null
  const latestPurchase = purchases.data?.content[0]

  return (
    <div className="flex flex-col">
      <section className="bg-sheet border-ink border-b-2">
        <div
          className={cn(
            CONTAINER,
            'flex flex-wrap items-center gap-5 py-6 md:gap-12 md:pt-16 md:pb-[72px]',
          )}
        >
          <div className="flex min-w-0 flex-[1_1_460px] flex-col gap-1.5 md:gap-[18px]">
            <span className="font-label hidden text-[13px] font-bold tracking-[0.04em] md:block">
              MY CLOSET · 내 옷장
            </span>
            <h1
              data-clarity-mask="true"
              className="font-display text-[44px] leading-none [overflow-wrap:anywhere] md:text-[84px]"
            >
              {child ? `안녕, ${child.name}!` : '안녕!'}
            </h1>
            <p className="font-hand text-[21px] leading-snug md:text-[28px]">
              오늘은 어떤 옷이 입고 싶어?
            </p>
            <div className="mt-2 hidden flex-wrap gap-3 md:flex">
              <Link to={paths.child.products} className="shop-btn min-h-[52px] text-base">
                옷 구경하러 가기 <span aria-hidden>→</span>
              </Link>
              <Link
                to={paths.child.cart}
                className="border-ink bg-paper text-ink hover:bg-marker inline-flex min-h-[52px] items-center border-2 px-[22px] text-base font-bold"
              >
                장바구니 {cartLines ? `${cartLines.length}벌` : ''}
              </Link>
            </div>
          </div>

          <div
            data-clarity-mask="true"
            className="bg-paper border-ink flex w-full flex-[1_1_520px] flex-col gap-3 border-2 px-4 pt-3.5 pb-4 shadow-[5px_5px_0_var(--shop-ink)] md:max-w-[600px] md:gap-[22px] md:px-8 md:pt-7 md:pb-[30px] md:shadow-[8px_8px_0_var(--shop-ink)]"
          >
            {profile.isPending && <StateMessage>불러오는 중…</StateMessage>}
            {profile.isError && (
              <StateMessage tone="error">
                {getErrorStatus(profile.error) === 404
                  ? '아직 보호자가 연결한 프로필이 없어요.'
                  : getErrorMessage(profile.error)}
              </StateMessage>
            )}
            {child && ruler && (
              <>
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-label text-xs font-bold tracking-[0.04em] md:text-[13px]">
                      지금 내 키
                    </span>
                    <span className="font-display text-[38px] leading-none md:text-[60px]">
                      {child.heightCm}
                      <span className="ml-1 text-lg md:text-[26px]">cm</span>
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="font-label text-xs font-bold tracking-[0.04em] md:text-[13px]">
                      <span className="hidden md:inline">나한테 </span>잘 맞는 사이즈
                    </span>
                    <span className="bg-marker border-ink font-display border-2 px-2.5 text-2xl leading-[1.2] md:px-3.5 md:text-[34px]">
                      {ruler.band.size}
                    </span>
                  </div>
                </div>
                <SizeRulerBar ruler={ruler} name={child.name} />
                <ul className="flex flex-wrap items-center gap-2 text-[13px]">
                  {[
                    `몸무게 ${child.weightKg}kg`,
                    `만 ${ageOf(child.birthDate)}세`,
                    `성장 기록 ${child.growthRecordCount}건`,
                  ].map((chip) => (
                    <li key={chip} className="border-ink figure border-[1.5px] px-2.5 py-1">
                      {chip}
                    </li>
                  ))}
                  <li className="font-hand ml-auto hidden text-[17px] md:block">
                    키가 크면 보호자에게 알려 줘!
                  </li>
                </ul>
              </>
            )}
          </div>
        </div>
      </section>

      <div className={cn(CONTAINER, 'flex flex-col gap-10 py-6 md:gap-16 md:pt-14 md:pb-[72px]')}>
        <section aria-labelledby="closet-now" className="flex flex-col gap-3 md:gap-5">
          <h2 id="closet-now" className="font-display text-[22px] md:text-[32px]">
            지금 내 옷장
          </h2>
          <div className="grid grid-cols-3 gap-2 md:gap-5">
            <Tile
              to={paths.child.cart}
              label="조를 수 있는 옷"
              count={sendableCount}
              unit="벌"
              hint="담아 둔 옷을 보호자에게 조를 수 있어"
              cta="조르기 보내기"
              shortCta="조르기"
              isMarked
            />
            <Tile
              to={paths.child.wishes}
              label="조르는 중"
              count={waiting?.length}
              unit="건"
              hint={
                waiting?.length ? (
                  <>
                    보호자가 보고 있어
                    {soonest && (
                      <>
                        {' '}
                        · <b>{soonest}</b>
                      </>
                    )}
                  </>
                ) : (
                  '기다리는 조르기가 없어'
                )
              }
              cta="조르기 보기"
              shortCta={soonest ?? '보기'}
            />
            <Tile
              to={paths.child.purchases}
              label="사 준 옷"
              count={purchases.data?.totalElements}
              unit="벌"
              hint={
                latestPurchase
                  ? `최근에 받은 옷: ${latestPurchase.productName}`
                  : '아직 받은 옷이 없어'
              }
              cta="사 준 옷 보기"
              shortCta="보기"
            />
          </div>
        </section>

        <section aria-labelledby="closet-picks" className="flex flex-col gap-4 md:gap-5">
          <div className="border-ink flex flex-wrap items-baseline justify-between gap-4 border-b-2 pb-3">
            <h2 id="closet-picks" className="font-display text-[22px] md:text-[32px]">
              {showsNewArrivals ? '새로 들어온 옷' : '내 키에 딱 맞는 옷'}
            </h2>
            <Link
              to={paths.child.products}
              className="text-ink text-[15px] font-bold underline underline-offset-4"
            >
              더 구경하기 <span aria-hidden>→</span>
            </Link>
          </div>
          {isRowPending && <CardGridSkeleton count={ROW_SIZE} />}
          {showsNewArrivals && newArrivals.isError && (
            <StateMessage tone="error">{getErrorMessage(newArrivals.error)}</StateMessage>
          )}
          {row.length > 0 && (
            <div className="grid grid-cols-2 gap-x-3 gap-y-7 md:grid-cols-4 md:gap-x-5">
              {row.map((product) => (
                <ProductTile
                  key={product.id}
                  to={paths.child.product(product.id)}
                  name={product.name}
                  seller={product.businessName}
                  price={product.minPrice}
                  imageUrl={product.imageUrl}
                  isSoldOut={product.isSoldOut}
                  tag={product.tag}
                  action={
                    <FavoriteButton
                      productId={product.id}
                      owner="child"
                      isFavorited={favorited.data?.has(product.id) ?? false}
                      isLoading={favorited.isPending}
                      isSelling
                      isCompact
                    />
                  }
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
