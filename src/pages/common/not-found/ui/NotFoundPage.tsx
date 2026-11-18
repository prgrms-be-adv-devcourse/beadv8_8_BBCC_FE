import { Link } from 'react-router'
import { paths } from '@/shared/config'
import { Button } from '@/shared/ui/button'
import { PageHeader } from '@/shared/ui/PageHeader'

type NotFoundPageProps = {
  /** 「홈으로」가 갈 곳: 영역마다 다르다 (기본은 쇼핑 홈) */
  homeTo?: string
}

/** 없는 주소: 영역 레이아웃 안에서 제목 · 안내 상자 · 홈으로 버튼 */
export function NotFoundPage({ homeTo = paths.shop.home }: NotFoundPageProps) {
  return (
    <div className="space-y-4">
      <PageHeader
        title="페이지를 찾을 수 없습니다"
        description="주소가 바뀌었거나 없어진 화면이에요."
      />
      <div className="bg-paper-2 space-y-3 p-8 text-center">
        <p className="font-semibold">찾는 화면이 없어요</p>
        <p className="text-ink-2 text-[13px]">주소를 다시 확인하거나 홈에서 다시 찾아 주세요.</p>
        <Button asChild>
          <Link to={homeTo}>홈으로</Link>
        </Button>
      </div>
    </div>
  )
}
