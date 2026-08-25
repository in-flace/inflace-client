import { create } from 'zustand'

interface ScrollToTopVisibilityState {
  isVisible: boolean
  setVisible: (value: boolean) => void
}

/* 맨 위로 버튼이 지금 화면에 떠 있는지.
 *
 * 이 버튼은 경쟁 채널 분석 페이지에서 일정 높이 이상 스크롤해야 나타난다.
 * 같은 코너를 쓰는 다른 고정 요소(피드백 진입점)가 그때만 비켜설 수 있도록
 * 표시 여부를 밖으로 노출한다. shared는 features를 참조할 수 없으므로
 * 반대 방향, 즉 읽는 쪽이 이 스토어를 가져가는 구조로 둔다. */
export const useScrollToTopVisible = create<ScrollToTopVisibilityState>(
  (set) => ({
    isVisible: false,
    setVisible: (value) => set({ isVisible: value }),
  })
)
