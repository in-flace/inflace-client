/* OpenAPI 스펙상 content에는 길이 제약이 없다. 입력 편의를 위한 프론트 값이다. */
export const INQUIRY_CONTENT_MAX = 1000

/* 서버가 submissionLocation을 maxLength 100으로 검증한다.
 * 경로가 이보다 길면 400이 나므로 잘라서 보낸다. */
export const INQUIRY_LOCATION_MAX = 100

/* 전송 성공 카드에는 닫기 버튼이 없다(디자인). 이 시간이 지나면 스스로 닫힌다. */
export const INQUIRY_SUCCESS_CLOSE_DELAY = 2000

/* 진입점 버튼의 aria-controls와 패널의 id를 한 값으로 묶는다. */
export const INQUIRY_PANEL_ID = 'inquiry-panel'
