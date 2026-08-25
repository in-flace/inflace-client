export interface InquiryPayload {
  content: string
}

export interface InquiryPanelState {
  isOpen: boolean
  /* 전송 중 여부. 패널이 갱신하고 진입점 버튼도 읽는다. */
  isSubmitting: boolean
  open: () => void
  close: () => void
  toggle: () => void
  setSubmitting: (value: boolean) => void
}
