export interface InquiryPayload {
  content: string
  /* 피드백 접수 위치. 관리자 목록에 그대로 노출되는 값이라 경로만 담는다.
   * 쿼리스트링에는 검색어가 섞일 수 있어 제외한다. */
  submissionLocation: string
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
