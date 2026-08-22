/* 한 줄짜리 "안돼요" 같은 문의는 운영팀이 파악할 단서가 없어 되묻기만 늘어난다.
 * 최소 길이로 최소한의 맥락을 유도한다. */
export const INQUIRY_CONTENT_MIN = 10

/* 서버 컬럼 길이가 확정되기 전까지의 방어값. 확정되면 그 값에 맞춘다. */
export const INQUIRY_CONTENT_MAX = 1000
