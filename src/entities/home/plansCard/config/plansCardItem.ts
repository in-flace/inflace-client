import { PlansCardItem } from './types'

/* 두 플랜의 기능 구성은 같고 가격만 다르다.
 * 문구가 한 벌뿐이므로 중복해 적지 않고 공유한다. */
const PRO_FEATURES: PlansCardItem['features'] = [
  [
    { text: '인플루언서 검색 탭', emphasized: true },
    { text: ' 내 모든 기능 ' },
    { text: '무제한', emphasized: true },
  ],
  [
    { text: '경쟁 채널 분석이 가능한 ' },
    { text: '3 크레딧', emphasized: true },
    { text: ' 무료 제공' },
  ],
]

export const PLANS_CARD_ITEM: PlansCardItem[] = [
  {
    planName: 'PRO',
    price: '₩29,000',
    period: '월',
    features: PRO_FEATURES,
    buttonLabel: '시작하기',
  },
  {
    planName: 'PRO 얼리버드',
    price: '₩9,900',
    period: '월',
    features: PRO_FEATURES,
    buttonLabel: '시작하기',
    highlighted: true,
    /* 종료일이 정해지면 날짜 기반으로 바꾼다. 당분간 고정 문구로 둔다. */
    badge: '기간한정 66% 할인, 곧 종료!',
  },
]
