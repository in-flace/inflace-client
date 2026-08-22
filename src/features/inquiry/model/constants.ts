/* 서버 컬럼 길이가 확정되기 전까지의 방어값. 확정되면 그 값에 맞춘다. */
export const INQUIRY_CONTENT_MAX = 1000

/* 전송 성공 카드에는 닫기 버튼이 없다(디자인). 이 시간이 지나면 스스로 닫힌다. */
export const INQUIRY_SUCCESS_CLOSE_DELAY = 2000

/* 진입점 버튼의 aria-controls와 패널의 id를 한 값으로 묶는다. */
export const INQUIRY_PANEL_ID = 'inquiry-panel'
