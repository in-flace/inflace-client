import type { NavGroup } from './types'

export const NAV_ITEMS: NavGroup[] = [
  {
    id: 1,
    group: '내 채널 분석',
    items: [
      {
        title: '채널 분석',
        icon: 'dashboard',
        url: '/channel',
        requiresAuth: true,
        requiresChannel: true,
      },
      {
        title: '영상 성과 분석',
        icon: 'video',
        url: '/videos',
        requiredPlan: 'GROWTH',
        requiresAuth: true,
        requiresChannel: true,
      },
    ],
  },
  {
    id: 2,
    group: '인플루언서 탐색',
    items: [
      {
        title: '인플루언서 검색',
        icon: 'search',
        url: '/influencer',
      },
      {
        title: '경쟁 채널 분석',
        icon: 'chart',
        url: '/competitor',
        requiredPlan: 'GROWTH',
      },
    ],
  },
  // 미사용 사이드 바 메뉴 임시 주석 처리

  // {
  //   id: 3,
  //   group: '비즈니스 전략',
  //   items: [
  //     {
  //       title: '콘텐츠 전략',
  //       icon: 'resing',
  //       url: '',
  //       requiredPlan: 'GROWTH',
  //     },
  //     {
  //       title: '트렌드 매거진',
  //       icon: 'article',
  //       url: '',
  //       requiredPlan: 'GROWTH',
  //     },
  //   ],
  // },
  // {
  //   id: 4,
  //   group: '협업',
  //   items: [
  //     {
  //       title: '협업 매칭',
  //       icon: 'message',
  //       url: '',
  //       requiredPlan: 'GROWTH',
  //     },
  //   ],
  // },
]

/* 고객센터는 NAV_ITEMS에 넣지 않는다.
 * 다른 그룹은 위에서부터 순서대로 쌓이지만 이 그룹만 하단에 고정되고
 * 구분선을 갖는다. 같은 배열에 두면 NavGroupList가 마지막 항목만
 * 다르게 분기해야 한다. */
export const SUPPORT_NAV_GROUP: NavGroup = {
  id: 5,
  group: '고객센터',
  items: [
    {
      title: '1:1 문의하기',
      icon: 'kakao',
      url: 'https://pf.kakao.com/_KpzSX',
      external: true,
    },
  ],
}
