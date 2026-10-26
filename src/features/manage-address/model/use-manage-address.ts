import { useMutation, useQueryClient } from '@tanstack/react-query'
import { addressApi, addressKeys, toAddressRequest, type AddressForm } from '@/entities/address'
import { toast } from '@/shared/lib'
import { runWithAction } from '@/shared/api'

export function useRegisterAddress({ onDone }: { onDone?: () => void } = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (form: AddressForm) =>
      runWithAction('배송지 등록', () => addressApi.create(toAddressRequest(form))),
    onSuccess: () => {
      toast('배송지를 등록했어요')
      void queryClient.invalidateQueries({ queryKey: addressKeys.all })
      onDone?.()
    },
  })
}

export function useAddressActions(addressId: string) {
  const queryClient = useQueryClient()
  const onSuccess = () => queryClient.invalidateQueries({ queryKey: addressKeys.all })

  const makeDefault = useMutation({
    mutationFn: () => runWithAction('기본 배송지 변경', () => addressApi.makeDefault(addressId)),
    onSuccess: () => {
      toast('기본 배송지로 바꿨어요')
      return onSuccess()
    },
  })
  const remove = useMutation({
    mutationFn: () => runWithAction('배송지 삭제', () => addressApi.remove(addressId)),
    onSuccess: () => {
      toast('배송지를 삭제했어요')
      return onSuccess()
    },
  })

  return {
    makeDefault: () => makeDefault.mutate(),
    remove: () => remove.mutate(),
    pending: makeDefault.isPending || remove.isPending,
    error: makeDefault.error ?? remove.error,
  }
}

/** 배송지 수정 (전체 교체) */
export function useUpdateAddress(addressId: string, { onDone }: { onDone?: () => void } = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (form: AddressForm) =>
      runWithAction('배송지 수정', () => addressApi.update(addressId, toAddressRequest(form))),
    onSuccess: () => {
      toast('배송지를 수정했어요')
      void queryClient.invalidateQueries({ queryKey: addressKeys.all })
      onDone?.()
    },
  })
}
