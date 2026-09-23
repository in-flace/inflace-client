import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  postProfileImageUploadUrl,
  uploadFileToS3,
  putProfileImage,
} from '../api/profileImageApi'

export function useEditProfileImage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const { uploadUrl, objectKey } = await postProfileImageUploadUrl({
        contentType: file.type,
        fileSize: file.size,
      })

      await uploadFileToS3(uploadUrl, file)

      return putProfileImage({ objectKey })
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(['myProfile'], updatedProfile)
    },
    onError: () => {
      toast.error('프로필 사진 변경에 실패했습니다. 다시 시도해주세요.')
    },
  })
}
