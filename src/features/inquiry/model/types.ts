export interface InquiryPayload {
  content: string
}

export interface InquiryPanelState {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}
