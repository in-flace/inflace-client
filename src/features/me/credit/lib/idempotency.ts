/* 백엔드는 idempotency 키를 payload와 무관하게 "이미 본 키인가"로만 판정하고,
 * 원래 응답을 재생해주지 않는다. 게다가 preHandle에서 키를 먼저 소모하므로
 * 요청이 실패해도 1시간(TTL) 동안 그 키는 되살아나지 않는다
 * (서버 IdempotencyKeyInterceptor). 키를 재사용하면 재시도가 전부
 * COMMON_409_IDEMPOTENCY로 막히므로 시도마다 새로 만든다.
 * 같은 이유로 결제창 리디렉션 너머로 키를 들고 가서도 안 된다.
 * 같은 시도가 중복 전송되는 것은 버튼 비활성화로 막는다. */
export function createIdempotencyKey() {
  return crypto.randomUUID()
}
