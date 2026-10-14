import { Link } from 'react-router'
import { paths } from '@/shared/config'

export function NotFoundPage() {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold">페이지를 찾을 수 없습니다</h1>
      <Link to={paths.shop.home} className="underline">
        홈으로
      </Link>
    </div>
  )
}
