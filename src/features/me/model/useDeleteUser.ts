import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { deleteUser } from '../api/userApi'

export const useDeleteUser = () =>
  useMutation({
    mutationFn: deleteUser,
    onError: () => {
      toast.error('계정 탈퇴에 실패했습니다. 다시 시도해주세요.')
    },
  })
