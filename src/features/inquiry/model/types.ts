export interface InquiryPayload {
  content: string
}

export interface InquiryModalState {
  isOpen: boolean
  open: () => void
  close: () => void
}
