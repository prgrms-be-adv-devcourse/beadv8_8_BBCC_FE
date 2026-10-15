import { matchPath } from 'react-router'
import { DEMO_GUIDES, type DemoGuide } from '../config/guides'

/** 콘솔 주소 → 시연 안내 (없으면 null) */
export function findDemoGuide(pathname: string): DemoGuide | null {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  return DEMO_GUIDES.find((entry) => matchPath(entry.path, path))?.guide ?? null
}
