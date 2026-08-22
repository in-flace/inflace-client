import { useMutation } from '@tanstack/react-query'

import { submitInquiry } from '../api/inquiryApi'

export const useSubmitInquiry = () =>
  useMutation({
    mutationFn: submitInquiry,
  })
