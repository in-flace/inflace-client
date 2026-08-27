export default function TermsPage() {
  return (
    <article className='mx-auto w-full max-w-5xl px-32 py-64 text-[17px] text-gray-800'>
      <header className='mb-56 border-b border-gray-200 pb-40'>
        <h1 className='text-4xl font-bold text-gray-900'>INFLACE 이용약관</h1>
        <p className='mt-16 text-base text-gray-500'>시행일: 2026년 6월 1일</p>
      </header>

      <Section title='제1조 (목적)'>
        <p className='leading-32 text-gray-700'>
          이 약관은 인플레이스(이하 &ldquo;회사&rdquo;)가 제공하는 INFLACE
          서비스(이하 &ldquo;서비스&rdquo;)의 이용과 관련하여 회사와 이용자 간의
          권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
        </p>
      </Section>

      <Section title='제2조 (정의)'>
        <p className='mb-16 leading-32 text-gray-700'>
          이 약관에서 사용하는 용어의 정의는 다음과 같습니다.
        </p>
        <ol className='list-decimal space-y-8 pl-24 leading-32 text-gray-700'>
          <li>
            <strong>&ldquo;서비스&rdquo;</strong>란 회사가 제공하는 INFLACE
            플랫폼 및 관련 제반 서비스를 의미합니다.
          </li>
          <li>
            <strong>&ldquo;이용자&rdquo;</strong>란 이 약관에 따라 회사와
            이용계약을 체결하고 서비스를 이용하는 회원 및 비회원을 말합니다.
          </li>
          <li>
            <strong>&ldquo;회원&rdquo;</strong>란 회사에 개인정보를 제공하여
            회원등록을 한 자로서, 회사의 서비스를 지속적으로 이용할 수 있는 자를
            말합니다.
          </li>
          <li>
            <strong>&ldquo;유료 회원&rdquo;</strong>이란 유료 구독 플랜(Starter,
            Growth)에 가입하여 서비스를 이용하는 회원을 말합니다.
          </li>
          <li>
            <strong>&ldquo;구독 플랜&rdquo;</strong>이란 회사가 제공하는 Free,
            Starter, Growth 등 서비스 이용 등급을 말합니다.
          </li>
          <li>
            <strong>&ldquo;콘텐츠&rdquo;</strong>란 서비스 내에서 제공되는
            매거진, 분석 데이터, 보고서 등 일체의 정보를 의미합니다.
          </li>
        </ol>
      </Section>

      <Section title='제3조 (약관의 효력 및 변경)'>
        <ol className='list-decimal space-y-8 pl-24 leading-32 text-gray-700'>
          <li>
            이 약관은 서비스를 이용하고자 하는 모든 이용자에 대하여 효력을
            발생합니다.
          </li>
          <li>
            회사는 약관의 규제에 관한 법률, 정보통신망 이용촉진 및 정보보호 등에
            관한 법률 등 관련 법령을 위반하지 않는 범위에서 이 약관을 변경할 수
            있습니다.
          </li>
          <li>
            약관을 변경할 경우 회사는 변경 내용과 시행일을 명시하여 시행일 7일
            전부터 서비스 내 공지사항 또는 이메일을 통해 공지합니다. 단,
            이용자에게 불리한 변경의 경우 30일 전부터 공지합니다.
          </li>
          <li>
            이용자가 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단하고
            이용계약을 해지할 수 있습니다.
          </li>
        </ol>
      </Section>

      <Section title='제4조 (서비스의 제공 및 변경)'>
        <ol className='list-decimal space-y-12 pl-24 leading-32 text-gray-700'>
          <li>
            회사가 제공하는 서비스는 다음과 같습니다.
            <ul className='mt-8 list-disc space-y-4 pl-24'>
              <li>채널 요약 및 성과 대시보드</li>
              <li>인플루언서 통합 검색</li>
              <li>경쟁 채널 벤치마크</li>
              <li>인플루언서 임팩트 지표</li>
              <li>인플루언서 전략 도구</li>
              <li>커뮤니케이션 도구</li>
              <li>매거진 콘텐츠</li>
              <li>기타 회사가 추가 개발하거나 제휴를 통해 제공하는 서비스</li>
            </ul>
          </li>
          <li>
            각 서비스 기능의 제공 범위는 구독 플랜에 따라 달라질 수 있습니다.
          </li>
          <li>
            회사는 서비스의 품질 향상, 기술적 필요 등 상당한 이유가 있는 경우
            제공하는 서비스를 변경할 수 있으며, 이 경우 변경 내용 및 일시를
            사전에 공지합니다.
          </li>
        </ol>
      </Section>

      <Section title='제5조 (서비스 이용계약의 성립)'>
        <ol className='list-decimal space-y-12 pl-24 leading-32 text-gray-700'>
          <li>
            이용계약은 이용자가 이 약관 및 개인정보처리방침에 동의하고
            회원가입을 완료함으로써 성립합니다.
          </li>
          <li>
            회사는 다음 각 호에 해당하는 경우 이용계약 신청을 승낙하지 않거나
            사후에 이용계약을 해지할 수 있습니다.
            <ul className='mt-8 list-disc space-y-4 pl-24'>
              <li>타인의 명의를 사용하여 신청한 경우</li>
              <li>
                허위 정보를 기재하거나 회사가 요구하는 정보를 제공하지 않은 경우
              </li>
              <li>서비스의 운영을 방해하거나 방해할 우려가 있는 경우</li>
              <li>
                기타 관련 법령 위반 또는 부당한 목적으로 서비스를 이용하려는
                경우
              </li>
            </ul>
          </li>
        </ol>
      </Section>

      <Section title='제6조 (회원 계정 및 정보 관리)'>
        <ol className='list-decimal space-y-8 pl-24 leading-32 text-gray-700'>
          <li>
            회원은 자신의 계정 정보(이메일, 비밀번호 등)를 스스로 관리할 책임이
            있습니다.
          </li>
          <li>회원은 계정 정보를 제3자에게 양도, 대여, 공유할 수 없습니다.</li>
          <li>
            계정 정보 유출 등 보안 문제 발생 시 즉시 회사에 통보하여야 하며,
            통보 전 발생한 손해에 대해 회사는 책임지지 않습니다.
          </li>
          <li>
            회원은 이메일 주소 변경 등 회원정보 변경 시 즉시 서비스 내에서
            정보를 수정하여야 합니다.
          </li>
        </ol>
      </Section>

      <Section title='제7조 (회원 탈퇴 및 자격 상실)'>
        <ol className='list-decimal space-y-12 pl-24 leading-32 text-gray-700'>
          <li>
            회원은 언제든지 서비스 내 설정 메뉴를 통해 탈퇴를 신청할 수
            있습니다.
          </li>
          <li>
            유료 구독 중인 회원이 탈퇴를 신청하는 경우, 현재 결제 주기 종료 후
            탈퇴가 처리됩니다.
          </li>
          <li>
            회원이 다음 각 호의 사유에 해당하는 경우 회사는 사전 통보 후
            이용계약을 해지할 수 있습니다.
            <ul className='mt-8 list-disc space-y-4 pl-24'>
              <li>타인의 계정을 도용하거나 허위 정보를 제공한 경우</li>
              <li>
                서비스 내 불법 행위, 음란물 유포, 타인에 대한 명예훼손 등을 행한
                경우
              </li>
              <li>서비스의 운영을 고의로 방해한 경우</li>
              <li>기타 이 약관 및 관계 법령을 위반한 경우</li>
            </ul>
          </li>
        </ol>
      </Section>

      <Section title='제8조 (이용요금 및 결제)'>
        <ol className='list-decimal space-y-12 pl-24 leading-32 text-gray-700'>
          <li>
            유료 서비스의 이용요금은 다음과 같습니다.
            <ul className='mt-8 list-disc space-y-4 pl-24'>
              <li>
                <strong>Starter</strong>: 월 29,000원 (부가세 포함)
              </li>
              <li>
                <strong>Growth</strong>: 월 89,000원 (부가세 포함)
              </li>
              <li>
                요금은 서비스 정책에 따라 변경될 수 있으며, 변경 시 30일 전 사전
                공지합니다.
              </li>
            </ul>
          </li>
          <li>
            결제는 회원이 등록한 신용카드 또는 체크카드를 통한
            자동결제(정기결제) 방식으로 진행됩니다.
          </li>
          <li>
            결제는 구독 시작일 기준으로 매월 동일한 날짜에 자동 청구됩니다.
          </li>
          <li>
            결제 실패 시 회사는 재시도를 수행하며, 일정 기간 내 결제가 완료되지
            않을 경우 서비스 이용이 제한될 수 있습니다.
          </li>
          <li>
            결제는 토스페이먼츠를 통해 처리되며, 카드 정보는 회사가 직접
            보관하지 않습니다.
          </li>
        </ol>
      </Section>

      <Section title='제9조 (무료 체험)'>
        <ol className='list-decimal space-y-8 pl-24 leading-32 text-gray-700'>
          <li>
            회사는 Starter 및 Growth 플랜에 대해 최초 1회에 한하여 30일 무료
            체험을 제공합니다.
          </li>
          <li>
            무료 체험 시작 시 결제 수단(카드) 등록이 필요하며, 체험 기간 종료 후
            자동으로 유료 결제가 진행됩니다.
          </li>
          <li>
            무료 체험 종료 7일 전 이메일을 통해 자동 결제 예정 사실을
            안내합니다.
          </li>
          <li>
            자동 결제를 원하지 않는 경우 체험 기간 종료 전에 구독을 해지하여야
            합니다.
          </li>
          <li>동일 계정으로 동일 플랜의 무료 체험은 1회로 제한됩니다.</li>
        </ol>
      </Section>

      <Section title='제10조 (구독 플랜 변경)'>
        <ol className='list-decimal space-y-8 pl-24 leading-32 text-gray-700'>
          <li>
            <strong>업그레이드</strong> (하위 플랜 → 상위 플랜): 즉시 적용되며,
            남은 구독 기간에 대한 차액이 일할 계산되어 즉시 청구됩니다.
          </li>
          <li>
            <strong>다운그레이드</strong> (상위 플랜 → 하위 플랜): 현재 결제
            주기 만료 후 다음 결제 주기부터 변경된 플랜이 적용됩니다.
          </li>
          <li>Free 플랜으로의 변경은 구독 해지와 동일하게 처리됩니다.</li>
        </ol>
      </Section>

      <Section title='제11조 (환불 정책)'>
        <ol className='list-decimal space-y-12 pl-24 leading-32 text-gray-700'>
          <li>
            구독 서비스의 특성상{' '}
            <strong>원칙적으로 환불이 제공되지 않습니다.</strong>
          </li>
          <li>
            단, 다음의 경우에는 예외적으로 환불을 검토할 수 있습니다.
            <ul className='mt-8 list-disc space-y-4 pl-24'>
              <li>서비스 장애로 인해 7일 이상 서비스를 이용하지 못한 경우</li>
              <li>회사의 귀책 사유로 인한 서비스 불가 상황</li>
            </ul>
          </li>
          <li>
            환불 요청은 고객센터(이메일)를 통해 접수하며, 회사는 접수일로부터 7
            영업일 이내에 검토 결과를 안내합니다.
          </li>
          <li>
            무료 체험 기간 중에는 결제가 발생하지 않으므로 환불 대상이 아닙니다.
          </li>
        </ol>
      </Section>

      <Section title='제12조 (서비스 이용 제한 및 중단)'>
        <ol className='list-decimal space-y-12 pl-24 leading-32 text-gray-700'>
          <li>
            회사는 다음 각 호에 해당하는 경우 서비스 제공을 일시적으로 중단할 수
            있습니다.
            <ul className='mt-8 list-disc space-y-4 pl-24'>
              <li>서버 정기점검, 시스템 교체 등 기술적 필요에 의한 경우</li>
              <li>
                천재지변, 전쟁, 사이버 테러 등 불가항력적 사유가 발생한 경우
              </li>
              <li>서비스 운영상 긴급한 사유가 있는 경우</li>
            </ul>
          </li>
          <li>
            서비스 중단 시 회사는 사전에 공지합니다. 단, 불가피한 경우 사후
            공지할 수 있습니다.
          </li>
          <li>
            서비스 중단으로 인한 손해에 대해 회사는 고의 또는 중과실이 없는 한
            책임을 지지 않습니다.
          </li>
        </ol>
      </Section>

      <Section title='제13조 (저작권 및 지식재산권)'>
        <ol className='list-decimal space-y-8 pl-24 leading-32 text-gray-700'>
          <li>
            서비스 내 회사가 제공하는 모든 콘텐츠(매거진, 분석 데이터, UI/디자인
            등)의 저작권 및 지식재산권은 회사에 귀속됩니다.
          </li>
          <li>
            이용자는 서비스에서 제공하는 콘텐츠를 회사의 사전 서면 동의 없이
            복제, 전송, 출판, 배포, 방송하거나 기타 방법으로 영리 목적으로
            이용할 수 없습니다.
          </li>
          <li>
            이용자가 서비스 이용 중 게시하는 콘텐츠에 대한 저작권은 이용자에게
            귀속됩니다. 단, 이용자는 회사가 서비스 운영 및 홍보 목적으로 해당
            콘텐츠를 사용할 수 있도록 비독점적 라이선스를 부여합니다.
          </li>
        </ol>
      </Section>

      <Section title='제14조 (면책조항)'>
        <ol className='list-decimal space-y-8 pl-24 leading-32 text-gray-700'>
          <li>
            회사는 천재지변, 전쟁, 기간통신사업자의 서비스 중단 등 불가항력으로
            서비스를 제공할 수 없는 경우 서비스 제공에 관한 책임을 지지
            않습니다.
          </li>
          <li>
            회사는 이용자의 귀책 사유로 인한 서비스 이용 장애에 대해 책임을 지지
            않습니다.
          </li>
          <li>
            회사는 서비스에서 제공하는 데이터 및 분석 정보의 정확성, 완전성에
            대해 보증하지 않으며, 이를 근거로 한 이용자의 의사결정에 대해 책임을
            지지 않습니다.
          </li>
          <li>
            회사는 이용자 간 또는 이용자와 제3자 간에 서비스를 매개로 발생한
            분쟁에 대해 개입할 의무가 없으며 이로 인한 손해를 배상할 책임이
            없습니다.
          </li>
        </ol>
      </Section>

      <Section title='제15조 (분쟁 해결 및 준거법)'>
        <ol className='list-decimal space-y-8 pl-24 leading-32 text-gray-700'>
          <li>
            회사와 이용자 간 발생한 분쟁에 대해 상호 협의를 통해 해결하는 것을
            원칙으로 합니다.
          </li>
          <li>
            분쟁이 해결되지 않을 경우 관련 법령에 따른 분쟁 조정 기관에 조정을
            신청할 수 있습니다.
          </li>
          <li>
            이 약관에 관한 소송은 대한민국 법률을 준거법으로 하며, 회사의 본사
            소재지를 관할하는 법원을 합의관할 법원으로 합니다.
          </li>
        </ol>
      </Section>

      <Section title='제16조 (YouTube API Services 및 YouTube 이용약관)'>
        <ol className='list-decimal space-y-8 pl-24 leading-32 text-gray-700'>
          <li>
            회사는 채널 연동, 데이터 조회 및 분석 기능을 제공하기 위해 YouTube
            API Services를 사용합니다.
          </li>
          <li>
            이용자가 서비스의 YouTube 연동 또는 분석 기능을 이용하는 경우, 본
            약관에 동의하는 것과 함께 YouTube 이용약관(
            <a
              href='https://www.youtube.com/t/terms'
              target='_blank'
              rel='noopener noreferrer'
              className='text-blue-600 underline underline-offset-2 hover:text-blue-700'>
              https://www.youtube.com/t/terms
            </a>
            )에 동의하고 이를 준수합니다.
          </li>
        </ol>
      </Section>

      <footer className='mt-64 border-t border-gray-200 pt-40'>
        <h2 className='mb-12 text-xl font-semibold text-gray-900'>부칙</h2>
        <p className='leading-32 text-gray-700'>
          이 약관은 2026년 6월 1일부터 시행합니다.
        </p>
        <p className='mt-8 leading-32 text-gray-700'>
          제16조(YouTube API Services 및 YouTube 이용약관)는 2026년 8월 26일부터
          시행합니다.
        </p>
        <div className='mt-24 rounded-md bg-gray-50 px-24 py-20 text-base'>
          <p className='mb-8 font-semibold text-gray-900'>
            문의처: 인플레이스 고객센터
          </p>
          <ul className='space-y-4 text-gray-700'>
            <li>
              이메일:{' '}
              <a
                href='mailto:inflaceproject@gmail.com'
                className='text-blue-600 underline underline-offset-2 hover:text-blue-700'>
                inflaceproject@gmail.com
              </a>
            </li>
            <li>운영시간: 평일 10:00 ~ 18:00 (주말 및 공휴일 제외)</li>
          </ul>
        </div>
      </footer>
    </article>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className='mb-56'>
      <h2 className='mb-20 text-2xl font-semibold text-gray-900'>{title}</h2>
      {children}
    </section>
  )
}
