import { FeatureSection, HeroMain, PlansSection } from '@/widgets/home'
import { HomeAuthGate } from '@/pages/home/ui/HomeAuthGate'

/* 정적 마크업은 서버 컴포넌트로 렌더링되어 LCP/SI에 유리하다.
 * 로그인 여부에 따른 리다이렉트, snap 클래스 토글, 모달 오픈 등
 * 클라이언트 전용 부수효과는 HomeAuthGate가 별도로 처리한다.
 */
export default function HomePage() {
  return (
    <>
      <HomeAuthGate />
      <HeroMain />
      <div className='snap-start'>
        <section className='grid grid-cols-1 gap-md px-md py-56 md:grid-cols-2 lg:grid-cols-3'>
          <FeatureSection />
        </section>
        <section className='px-md py-56'>
          <PlansSection />
        </section>
      </div>
    </>
  )
}
