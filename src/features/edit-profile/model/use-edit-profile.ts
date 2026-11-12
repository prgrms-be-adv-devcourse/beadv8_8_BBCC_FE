import { useMutation } from '@tanstack/react-query'
import { updateNickname, withdraw } from '@/entities/session'
import { runWithAction } from '@/shared/api'

/** 닉네임 변경 → 토큰 다시 받기 (새 닉네임이 토큰 · 화면에 반영) */
export function useUpdateNickname() {
  return useMutation({
    mutationFn: (nickname: string) => runWithAction('내 정보 수정', () => updateNickname(nickname)),
  })
}

/** 탈퇴 → 로그아웃 (Refresh Token 쿠키는 로그아웃이 지운다) */
export function useWithdraw({ onDone }: { onDone: () => void }) {
  return useMutation({
    mutationFn: () => runWithAction('탈퇴', () => withdraw()),
    onSuccess: onDone,
  })
}
