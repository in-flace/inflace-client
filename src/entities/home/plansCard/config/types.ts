/* 기능 문구는 한 줄 안에서 일부만 강조된다.
 * ex. "인플루언서 검색 탭" 내 모든 기능 "무제한" — 따옴표 부분만 브랜드 컬러
 * 줄 전체를 강조하던 이전 구조(active: boolean)로는 표현할 수 없어 조각 배열로 받는다. */
export interface PlanFeatureSegment {
  text: string
  emphasized?: boolean
}

export type PlanFeatureLine = PlanFeatureSegment[]

export interface PlansCardItem {
  planName: string
  price: string
  period: string | null
  features: PlanFeatureLine[]
  buttonLabel: string
  /* 강조 카드 — 배경 틴트, 브랜드 보더, 채운 버튼 */
  highlighted?: boolean
  /* 카드 위로 걸치는 프로모션 문구. 없으면 렌더하지 않는다 */
  badge?: string
}
