/* 서버가 파라미터 미입력 시 적용하는 값.
 *
 * 중립이 아니라 실제로 걸리는 필터다. 클라이언트가 아무것도 보내지 않으면
 * 참여율 2~3%, 광고이력 있음, 기본 카테고리로 좁혀진 결과가 온다.
 * 실서버로 확인한 결과 기본 진입 시 참여율 상위가 2.8%였고, 필터를 풀면
 * 17%인 채널이 나왔다. 화면에 드러내지 않으면 사용자는 "필터 없음"으로 오해한다.
 *
 * 그래서 이 값들을 UI 초기 상태로 보여주고 요청에도 명시적으로 실어 보낸다.
 * 화면에 보이는 것과 실제로 나가는 것을 일치시키는 것이 목적이다. */
export const SERVER_FILTER_DEFAULTS = {
  engagementRateFrom: '2',
  engagementRateTo: '3',
  hasAdHistory: 'true',
  useDefaultCategories: 'true',
} as const

/* 필터옵션: 업로드 주기 */
export const UPLOAD_PERIOD_OPTIONS: { label: string; value: string }[] = [
  { label: '1주일 미만', value: '7D' },
  { label: '1주일 ~ 1개월', value: '30D' },
  { label: '1개월 ~ 3개월', value: '31_90D' },
  { label: '3개월 ~ 6개월', value: '91_180D' },
  { label: '6개월 이상', value: '180D_PLUS' },
]

/* 필터옵션: outlier 배수 */
export const OUTLIER_RANGE_OPTIONS: { label: string; value: string }[] = [
  { label: '1.0x', value: '1.0X' },
  { label: '1.5x', value: '1.5X' },
  { label: '2.0x', value: '2.0X' },
  { label: '3.0x', value: '3.0X' },
]

/* 필터옵션: 광고이력 */
export const HAS_AD_HISTORY_OPTIONS: { label: string; value: string }[] = [
  { label: '있음', value: 'true' },
  { label: '없음', value: 'false' },
]
