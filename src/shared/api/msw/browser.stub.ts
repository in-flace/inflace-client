/* 프로덕션 빌드에서 browser.ts를 대체하는 스텁.
 *
 * MSWProvider는 NEXT_PUBLIC_MOCK_ENABLED가 'true'일 때만 이 모듈을
 * 동적 import하므로, mock이 꺼진 빌드에서는 실행되지 않는다.
 * 그럼에도 동적 import는 별도 청크를 생성하므로 msw와 핸들러 전체가
 * 번들에 남는다(gzip 약 119KB). next.config.ts의 webpack alias로
 * 이 파일을 대신 연결해 번들에서 제외한다.
 *
 * 실제 구현은 browser.ts에 있으며, 개발 환경에서는 그대로 사용된다.
 */
export const worker = {
  start: () => {
    throw new Error(
      'MSW worker는 프로덕션 빌드에서 제외됩니다. NEXT_PUBLIC_MOCK_ENABLED=true로 개발 환경에서 실행하세요.'
    )
  },
}