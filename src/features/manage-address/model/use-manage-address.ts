import { useMutation, useQueryClient } from '@tanstack/react-query'
import { addressApi, addressKeys, toAddressRequest, type AddressForm } from '@/entities/address'
import { runWithAction } from '@/shared/api'

export function useRegisterAddress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (form: AddressForm) =>
      runWithAction('배송지 등록', () => addressApi.create(toAddressRequest(form))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: addressKeys.all }),
  })
}

export function useAddressActions(addressId: string) {
  const queryClient = useQueryClient()
  const onSuccess = () => queryClient.invalidateQueries({ queryKey: addressKeys.all })

  const makeDefault = useMutation({
    mutationFn: () => runWithAction('기본 배송지 변경', () => addressApi.makeDefault(addressId)),
    onSuccess,
  })
  const remove = useMutation({
    mutationFn: () => runWithAction('배송지 삭제', () => addressApi.remove(addressId)),
    onSuccess,
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
      void queryClient.invalidateQueries({ queryKey: addressKeys.all })
      onDone?.()
    },
  })
}
