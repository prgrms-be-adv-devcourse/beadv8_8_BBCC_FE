import { Link } from 'react-router'
import { ageOf, sizeBandOf, type Child } from '@/entities/child'
import { paths } from '@/shared/config'

type SizeHeroProps = {
  child: Child | null
  /** 자녀가 둘 이상이면 다음 자녀로 */
  onNextChild: (() => void) | null
  onShopSize: () => void
  loggedIn: boolean
}

/** 왼쪽 큰 카드: 자녀 추천 사이즈를 큰 숫자로 (E안) */
export function SizeHero({ child, onNextChild, onShopSize, loggedIn }: SizeHeroProps) {
  const size = child ? sizeBandOf(child.heightCm).size : null
  return (
    <section className="bg-primary-soft relative overflow-hidden rounded-3xl p-6 md:p-8">
      <p
        aria-hidden
        className="text-primary absolute top-6 right-6 hidden rotate-[-6deg] text-right text-sm leading-snug font-semibold md:block"
      >
        오늘도 멋지게
        <br />
        자라나는 너에게 ♥
      </p>
      <div className="relative max-w-md space-y-4">
        {child && size ? (
          <>
            <p className="text-primary text-xs font-bold tracking-widest">
              FOR {child.name} · {ageOf(child.birthDate)}세 · {child.heightCm}cm
            </p>
            <p
              aria-label={`추천 사이즈 ${size}`}
              className="text-primary text-7xl leading-none font-black tracking-tight md:text-8xl"
            >
              {size}
            </p>
            <h1 className="text-primary-deep text-2xl font-extrabold text-balance md:text-3xl">
              {child.name}의 이번 시즌 사이즈는 {size}
            </h1>
            <p className="text-muted-foreground text-sm">
              키로 계산한 추천 사이즈예요. {size} 재고가 있는 상품만 모아 볼 수 있어요.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={onShopSize}
                className="bg-primary text-primary-foreground rounded-full px-5 py-2.5 text-sm font-bold"
              >
                {size} 사이즈 쇼핑하기 →
              </button>
              {onNextChild && (
                <button
                  type="button"
                  onClick={onNextChild}
                  className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold"
                >
                  다른 자녀 보기
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <p className="text-primary text-xs font-bold tracking-widest">FOR 우리 아이</p>
            <p aria-hidden className="text-primary text-7xl leading-none font-black md:text-8xl">
              ?
            </p>
            <h1 className="text-primary-deep text-2xl font-extrabold text-balance md:text-3xl">
              우리 아이에게 맞는 사이즈를 알려 드려요
            </h1>
            <p className="text-muted-foreground text-sm">
              브랜드마다 다른 사이즈, 자녀의 키만 알려 주면 맞는 사이즈가 있는 상품만 골라 드려요.
            </p>
            <Link
              to={loggedIn ? paths.shop.children : paths.login}
              className="bg-primary text-primary-foreground inline-block rounded-full px-5 py-2.5 text-sm font-bold"
            >
              {loggedIn ? '자녀 등록하고 맞춤 상품 보기' : '로그인하기'}
            </Link>
          </>
        )}
      </div>
    </section>
  )
}
