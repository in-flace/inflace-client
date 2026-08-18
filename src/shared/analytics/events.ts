import { sendGTMEvent } from '@next/third-parties/google'

/* GTM dataLayer로 보내는 이벤트를 한 곳에 모은다.
 *
 * 이벤트명을 문자열로 흩어 두면 오타가 런타임에야 드러나고, GTM 쪽 트리거와
 * 어긋나도 아무 신호가 없다. 여기서 타입으로 고정해 컴파일 단계에서 잡는다.
 *
 * sign_up / login은 GA4 권장 이벤트명이라 그대로 쓴다. 리포트에 바로 붙는다. */

/* 로그인 모달을 연 경로.
 *
 * session_expired는 사용자가 연 것이 아니라 axiosInstance가 401을 받고 강제로
 * 띄운 것이다. 전환율 분모에서 빼야 지표가 왜곡되지 않는다. */
export type LoginModalTrigger =
  | 'hero_cta'
  | 'header'
  | 'feature_card'
  | 'nav_menu'
  | 'channel_status'
  | 'competitor_gate'
  | 'login_page'
  | 'plan_card'
  | 'protected_redirect'
  | 'session_expired'

export type AuthProvider = 'google' | 'youtube'

/* 온보딩을 어떻게 끝냈는지.
 * youtube_connect는 채널 연동까지 함께 시도한 경로다. */
export type OnboardingCompletionMethod = 'youtube_connect' | 'skip'

type AnalyticsEvent =
  | { event: 'login_modal_opened'; trigger: LoginModalTrigger }
  | { event: 'login_provider_click'; method: AuthProvider }
  | { event: 'login_popup_blocked'; method: AuthProvider }
  | { event: 'login_popup_closed'; method: AuthProvider }
  | { event: 'login_failed'; method: AuthProvider; reason: string }
  /* 최초 가입. GA4에서 주요 이벤트(전환)로 표시할 대상이다. */
  | { event: 'sign_up'; method: AuthProvider; user_id: string }
  | { event: 'login'; method: AuthProvider; user_id: string }
  /* 가입 직후 자동으로 뜬다. 온보딩 완료율의 분모다. */
  | { event: 'onboarding_started' }
  /* 어느 단계에서 이탈하는지 보려면 단계별 통과 수가 필요하다.
   * step은 방금 끝낸 단계 번호다. */
  | { event: 'onboarding_step_completed'; step: number }
  /* 서버 저장이 성공한 경우에만 보낸다. 화면은 실패해도 모달을 닫으므로
   * (OnboardingActionButtons의 .finally(close)) UI 기준으로 세면 부풀려진다. */
  | { event: 'onboarding_completed'; method: OnboardingCompletionMethod }

/* GTM 컨테이너는 NEXT_PUBLIC_GTM_ID가 있을 때만 로드된다(app/layouts/index.tsx).
 * 없으면 sendGTMEvent가 조용히 아무 일도 하지 않으므로, 로컬에서 "이벤트가 안 뜬다"는
 * 대개 설정 누락이다. 전송 여부를 여기서 판단하지 않고 그대로 위임한다. */
export function trackEvent(payload: AnalyticsEvent) {
  sendGTMEvent(payload)
}
