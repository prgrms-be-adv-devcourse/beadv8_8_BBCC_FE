import { ConfirmHost } from '@/shared/ui/ConfirmHost'
import { Toaster } from '@/shared/ui/Toaster'

/** 확인 모달 · 토스트 (라우터 안에 있어야 알림의 이동 링크가 동작한다) */
export function Overlays() {
  return (
    <>
      <ConfirmHost />
      <Toaster />
    </>
  )
}
