import { Link, useLocation, useRouteError } from 'react-router'
import { areaOf, paths, type Area } from '@/shared/config'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { describeRouteError } from './route-error'

const AREA_HOME: Record<Area, string> = {
  shop: paths.shop.home,
  center: paths.center.home,
  admin: paths.admin.home,
  console: paths.console.home,
}

type RouteErrorProps = {
  /** 레이아웃까지 깨졌을 때: 화면 전체를 대신한다 */
  fullPage?: boolean
}

/** 화면 오류: 레이아웃(시연 막대 · 메뉴 · 흐름 패널)은 그대로 두고 본문 자리에만 보여 준다 */
export function RouteError({ fullPage = false }: RouteErrorProps) {
  const error = useRouteError()
  const { pathname } = useLocation()
  const view = describeRouteError(error)

  const card = (
    <Card role="alert" className="mx-auto max-w-xl space-y-3">
      <p className="text-lg font-bold">{view.title}</p>
      <p className="text-muted-foreground text-sm">
        다른 화면은 그대로 쓸 수 있어요. 다시 시도하거나 이 영역의 처음 화면으로 가 주세요.
      </p>
      {view.detail && (
        <pre className="bg-muted overflow-x-auto rounded p-2 text-xs whitespace-pre-wrap">
          {view.detail}
        </pre>
      )}
      <div className="flex gap-2">
        {view.reload && <Button onClick={() => window.location.reload()}>다시 시도</Button>}
        <Button asChild variant="outline">
          <Link to={AREA_HOME[areaOf(pathname)]}>처음 화면으로</Link>
        </Button>
      </div>
    </Card>
  )

  return fullPage ? <div className="bg-muted/30 min-h-svh p-6">{card}</div> : card
}
