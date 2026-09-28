import { LegalDocument, LegalSection } from '@/shared/ui/legal-document'

export default function PrivacyPage() {
  return (
    <LegalDocument
      title='INFLACE 개인정보처리방침'
      effectiveDate='2026년 6월 1일'
      intro={
        <p className='mb-56 leading-32 text-gray-700'>
          인플레이스(이하 &ldquo;회사&ldquo;)는 「개인정보 보호법」 등 관계
          법령을 준수하며, 이용자의 개인정보를 보호하고 관련 고충을 신속하게
          처리하기 위하여 다음과 같이 개인정보처리방침을 수립·공개합니다.
        </p>
      }
      footer={
        <>
          <h2 className='mb-12 text-xl font-semibold text-gray-900'>
            개정 부칙
          </h2>
          <p className='mt-8 leading-32 text-gray-700'>
            위 제13조는 2026년 8월 26일부터 시행합니다.
          </p>
          <p className='mt-8 leading-32 text-gray-700'>
            개정 내역: 2026년 8월 26일 결제 연동에 따른 개인정보 처리 수탁업체
            주식회사 코리아포트원(포트원) 추가
          </p>
          <h2 className='mb-12 text-xl font-semibold text-gray-900'>부칙</h2>
          <p className='leading-32 text-gray-700'>
            이 개인정보처리방침은 2026년 6월 1일부터 시행합니다.
          </p>
        </>
      }>
      <LegalSection title='제1조 (개인정보의 처리 목적)'>
        <p className='mb-16 leading-32 text-gray-700'>
          회사는 다음의 목적으로 개인정보를 처리합니다.
        </p>
        <ol className='list-decimal space-y-8 pl-24 leading-32 text-gray-700'>
          <li>회원가입, 본인 식별, 계정 관리 및 부정 이용 방지</li>
          <li>인플루언서 검색, 채널 분석, 경쟁 채널 분석 등 서비스 제공</li>
          <li>유료 구독, 구매 크레딧 결제, 자동결제, 취소, 환불 및 정산</li>
          <li>구독 상태, 크레딧 지급·사용·만료 및 오차감 처리</li>
          <li>문의, 불만, 분쟁 및 고객지원 처리</li>
          <li>서비스 안정성 확보, 장애 대응 및 이용 통계 분석</li>
          <li>이용자가 별도로 동의한 경우 이벤트·혜택 등 광고성 정보 전송</li>
        </ol>
      </LegalSection>

      <LegalSection title='제2조 (처리하는 개인정보의 항목)'>
        <h3 className='mt-24 mb-12 text-lg font-semibold text-gray-900'>
          1. 회원가입 및 서비스 이용
        </h3>
        <Table
          headers={['구분', '처리 항목']}
          rows={[
            ['필수', '이메일 주소, 비밀번호(일방향 암호화), 회원 식별값'],
            [
              '서비스 이용 시 자동 생성',
              '접속 IP, 접속 일시, 기기·브라우저 정보, 서비스 이용기록, 부정 이용기록, 오류 로그',
            ],
            [
              '분석 서비스 이용',
              '분석 대상, 분석 요청·완료 시각, 분석 결과 식별정보, 크레딧 지급·차감·복구 내역',
            ],
          ]}
        />

        <h3 className='mt-32 mb-12 text-lg font-semibold text-gray-900'>
          2. 결제 및 환불
        </h3>
        <Table
          headers={['구분', '처리 항목']}
          rows={[
            [
              '결제',
              '주문번호, 결제번호, 결제금액, 결제일시, 결제상태, 결제수단 종류, 카드사, 카드번호 일부, 승인번호, 빌링키 식별정보',
            ],
            [
              '구독',
              '구독 상품, 적용 가격, 얼리버드 여부, 결제주기, 다음 결제일, 구독·해지 상태, 가격 변경 동의 이력',
            ],
            [
              '크레딧',
              '구매 상품, 지급량, 잔여량, 구매·만료·연장일, 사용·복구·환불 내역',
            ],
            [
              '환불·분쟁',
              '환불 신청 사유, 환불금액, 취소번호, 문의 및 처리 내역',
            ],
            [
              '증빙 발급 시',
              '이름, 휴대전화번호, 사업자등록번호 등 증빙 발급에 필요한 정보',
            ],
          ]}
        />
        <p className='mb-16 leading-32 text-gray-700'>
          회사는 완전한 카드번호, 카드 비밀번호 또는 CVC를 직접 저장하지
          않습니다. 해당 정보는 포트원 및 연계 전자결제대행사·결제수단 제공자가
          처리합니다.
        </p>
      </LegalSection>

      <LegalSection title='제3조 (개인정보의 처리 및 보유기간)'>
        <p className='mb-16 leading-32 text-gray-700'>
          회사는 개인정보의 처리 목적이 달성되면 지체 없이 파기합니다. 다만,
          관계 법령에 따라 보존할 필요가 있는 경우 다음 기간 동안 분리하여
          보관합니다.
        </p>
        <Table
          headers={['보존 항목', '보존 기간', '근거']}
          rows={[
            ['계약 또는 청약철회 등에 관한 기록', '5년', '전자상거래법'],
            ['대금결제 및 재화·서비스 공급에 관한 기록', '5년', '전자상거래법'],
            ['소비자 불만 또는 분쟁처리에 관한 기록', '3년', '전자상거래법'],
            ['표시·광고에 관한 기록', '6개월', '전자상거래법'],
            [
              '접속기록',
              '최소 1년 이상 (5만 명 이상 정보주체에 관한 개인정보를 처리하는 경우 2년 이상)',
              '개인정보의 안전성 확보조치 기준(개인정보보호위원회 고시)',
            ],
          ]}
        />
        <p className='mb-16 leading-32 text-gray-700'>
          법정 보존기간이 적용되지 않는 회원정보는 원칙적으로 회원 탈퇴 시까지
          처리합니다. 부정 이용 방지를 위해 별도 보관이 필요한 정보가 있는 경우
          그 항목·기간·근거를 사전에 알립니다.
        </p>
      </LegalSection>

      <LegalSection title='제4조 (개인정보의 제3자 제공)'>
        <ol className='list-decimal space-y-8 pl-24 leading-32 text-gray-700'>
          <li>
            회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다.
          </li>
          <li>
            이용자가 사전에 동의한 경우 또는 법령에 특별한 규정이 있는 경우에만
            필요한 범위에서 제공합니다.
          </li>
          <li>
            결제 과정에서 카드사·은행·간편결제사 등 결제수단 제공자에게
            개인정보가 제공되는 경우, 제공받는 자, 제공 목적, 제공 항목 및
            보유기간은 결제 화면에서 별도로 안내합니다.
          </li>
        </ol>
      </LegalSection>

      <LegalSection title='제5조 (개인정보 처리업무의 위탁)'>
        <p className='mb-16 leading-32 text-gray-700'>
          회사는 원활한 서비스 제공을 위하여 다음과 같이 개인정보 처리업무를
          위탁합니다. 실제 계약 및 운영 환경에 따라 수탁업체가 변경되는 경우 이
          방침을 통해 공개합니다.
        </p>
        <Table
          headers={['수탁업체', '위탁 업무']}
          rows={[
            [
              '주식회사 코리아포트원(PortOne)',
              '결제 시스템(PortOne V2) 연동, 빌링키 발급 및 구독 정기결제 처리, 크레딧 결제(단건결제) 처리, 웹훅을 통한 결제 상태(승인·실패·취소) 동기화, 결제취소(환불) API 처리 지원',
            ],
            [
              '포트원을 통해 연계된 전자결제대행사(PG사) [KG이니시스]',
              '결제 승인, 자동결제, 취소, 환불 및 정산',
            ],
            [
              'Amazon Web Services, Inc. (AWS), Google LLC (Google Cloud Platform)',
              '서버 호스팅, 데이터 저장 및 백업',
            ],
            [
              'Google LLC (Gmail SMTP)',
              '결제·구독·크레딧 및 서비스 안내 이메일 발송',
            ],
          ]}
        />
        <p className='mt-16 leading-32 text-gray-700'>
          회사는 위탁계약에 개인정보의 목적 외 처리 금지, 기술적·관리적
          보호조치, 재위탁 관리, 수탁자 감독 및 손해배상에 관한 사항을 명시하고
          수탁자가 개인정보를 안전하게 처리하는지 관리·감독합니다.
        </p>
      </LegalSection>

      <LegalSection title='제6조 (개인정보의 국외 이전)'>
        <p className='mt-16 leading-32 text-gray-700'>
          회사가 이용하는 클라우드 또는 이메일 발송 서비스로 인해 개인정보가
          국외로 이전되는 경우, 회사는 이전받는 자, 이전 국가, 이전 항목, 이전
          목적, 이전 일시·방법, 보유기간 및 이전 거부 방법을 관계 법령에 따라
          별도로 공개하고 필요한 동의를 받거나 적법한 이전 근거를 마련합니다.
        </p>
        <Callout variant='info' className='mt-24'>
          <p className='mb-8 font-medium'>
            현재 사용하는 클라우드·이메일 업체의 저장 위치를 확인한 후 국외 이전
            여부와 세부 내용을 반드시 확정하여 기재해야 합니다.
          </p>
        </Callout>
      </LegalSection>

      <LegalSection title='제7조 (정보주체와 법정대리인의 권리 및 행사방법)'>
        <ol className='list-decimal space-y-8 pl-24 leading-32 text-gray-700'>
          <li>
            이용자는 언제든지 자신의 개인정보에 대한 열람, 정정·삭제, 처리정지
            및 동의 철회를 요청할 수 있습니다.{' '}
          </li>
          <li>
            이용자는 서비스 내 설정 또는 개인정보 보호책임자 이메일을 통해
            권리를 행사할 수 있습니다.
          </li>
          <li>
            회사는 본인 또는 정당한 대리인 여부를 확인한 후 관계 법령에서 정한
            기간 내에 처리 결과를 통지합니다.
          </li>
          <li>
            다른 법령에서 해당 개인정보의 수집 대상으로 명시한 경우 등에는 삭제
            또는 처리정지 요구가 제한될 수 있으며, 회사는 그 사유를 안내합니다.
          </li>
          <li>
            만 14세 미만 아동의 회원가입을 허용하는 경우 회사는 법정대리인의
            동의를 받는 절차를 마련합니다. 회사가 만 14세 미만 아동의 가입을
            허용하지 않는 경우 이를 회원가입 화면에 명확히 표시합니다.
          </li>
        </ol>
      </LegalSection>

      <LegalSection title='제8조 (개인정보의 파기)'>
        <ol className='list-decimal space-y-8 pl-24 leading-32 text-gray-700'>
          <li>
            회사는 보유기간이 지나거나 처리 목적이 달성된 개인정보를 지체 없이
            파기합니다.
          </li>
          <li>
            전자적 파일은 복구 또는 재생되지 않도록 안전한 방법으로 삭제하고,
            종이 문서는 분쇄하거나 소각합니다.
          </li>
          <li>
            관계 법령에 따라 보존하는 개인정보는 다른 개인정보와 분리하여
            보관하고 법정 목적 외에는 이용하지 않습니다.
          </li>
        </ol>
      </LegalSection>

      <LegalSection title='제9조 (개인정보의 안전성 확보조치)'>
        <p className='mb-16 leading-32 text-gray-700'>
          회사는 개인정보의 안전성 확보를 위하여 다음 조치를 시행합니다.
        </p>
        <ol className='list-decimal space-y-8 pl-24 leading-32 text-gray-700'>
          <li>개인정보 취급자 최소화 및 접근권한 관리</li>
          <li>비밀번호 등 중요정보 암호화</li>
          <li>전송구간 암호화(HTTPS/TLS)</li>
          <li>접속기록 보관 및 위·변조 방지</li>
          <li>보안프로그램 설치·갱신 및 정기 점검</li>
          <li>결제정보를 직접 저장하지 않고 전문 결제사업자를 통한 처리</li>
        </ol>
      </LegalSection>

      <LegalSection title='제10조 (쿠키 및 자동 수집 장치)'>
        <ol className='list-decimal space-y-8 pl-24 leading-32 text-gray-700'>
          <li>
            회사는 로그인 유지, 보안 및 서비스 개선을 위해 쿠키를 사용할 수
            있습니다.
          </li>
          <li>
            이용자는 브라우저 설정을 통해 쿠키 저장을 거부할 수 있습니다. 다만,
            필수 쿠키를 거부하면 로그인 등 일부 기능이 제한될 수 있습니다.
          </li>
          <li>
            맞춤형 광고 목적의 행태정보를 처리하는 경우 회사는 처리 항목, 수집
            방법, 목적, 보유기간 및 거부 방법을 별도로 공개합니다.
          </li>
        </ol>
      </LegalSection>

      <LegalSection title='제11조 (개인정보 보호책임자 및 권익침해 구제)'>
        <p className='mb-16 leading-32 text-gray-700'>
          회사는 개인정보 처리에 관한 문의와 불만 처리를 위하여 다음과 같이
          개인정보 보호책임자를 지정합니다.
        </p>
        <ul className='list-decimal space-y-8 pl-24 leading-32 text-gray-700'>
          <li>개인정보 보호책임자: 인플레이스 대표</li>
          <li>이메일: inflaceproject@gmail.com</li>
          <li>홈페이지: https://www.inflace.site/</li>
        </ul>
        <p className='mb-16 leading-32 text-gray-700'>
          개인정보 침해에 대한 상담 또는 구제가 필요한 경우
          개인정보침해신고센터(국번 없이 118), 개인정보분쟁조정위원회, 경찰청
          또는 관계 기관에 문의할 수 있습니다.
        </p>
      </LegalSection>

      <LegalSection title='제12조 (개인정보처리방침의 변경)'>
        <ol className='list-decimal space-y-8 pl-24 leading-32 text-gray-700'>
          <li>
            이 방침이 변경되는 경우 회사는 변경 내용과 시행일을 서비스 화면에
            공개합니다.
          </li>
          <li>
            일반적인 변경은 시행일 7일 전부터, 이용자의 권리에 중대한 영향을
            미치는 변경은 시행일 30일 전부터 알립니다.
          </li>
        </ol>
      </LegalSection>

      <LegalSection title='제13조 YouTube API Services 이용 및 데이터 처리'>
        <p className='mb-16 leading-32 text-gray-700'>
          <strong>개인정보보호위 처리</strong>:{' '}
          <a
            href='www.privacy.go.kr'
            target='_blank'
            rel='noopener noreferrer'
            className='text-blue-600 underline underline-offset-2 hover:text-blue-700'>
            www.privacy.go.kr
          </a>{' '}
          / 182 (국번 없이 연락 가능)
        </p>
        <ol className='list-decimal space-y-8 pl-24 leading-32 text-gray-700'>
          <li>
            YouTube API Services 사용 <br /> 회사는 채널 연동, 데이터 조회 및
            분석 기능을 제공하기 위해 YouTube Data API, YouTube Analytics API 및
            YouTube Reporting API를 포함한 YouTube API Services를 사용합니다.
          </li>
          <li>
            처리하는 YouTube 데이터와 이용 목적
            <br />
            회사는 공개된 채널·동영상 정보(채널 및 동영상 식별자, 제목, 설명,
            썸네일, 조회·좋아요·댓글·구독자·동영상 수 등)와 이용자가 Google
            계정을 통해 권한을 부여한 경우 해당 채널의 분석 정보(조회수, 시청
            시간, 시청 지속률, 트래픽 소스, 시청자 특성 등 집계 통계) 및 OAuth
            인증 토큰을 처리할 수 있습니다.
            <br />
            해당 데이터는 채널 연결 및 본인 채널 확인, 대시보드 제공,
            채널·콘텐츠 성과 분석, 성장 인사이트 제공과 서비스 보안 목적으로만
            이용합니다.
          </li>
          <li>
            Google 개인정보처리방침 <br /> YouTube API Services를 통한 데이터
            처리에는 Google 개인정보처리방침 ({' '}
            <a
              href='https://policies.google.com/privacy'
              target='_blank'
              rel='noopener noreferrer'
              className='text-blue-600 underline underline-offset-2 hover:text-blue-700'>
              https://policies.google.com/privacy
            </a>
            )이 적용될 수 있습니다.
          </li>
          <li>
            보유기간 및 갱신 <br />
            회사는 YouTube API 데이터와 인증 정보를 서비스 제공에 필요한
            기간에만 보유합니다. 관련 정책에 따라 최소 30일마다 저장 데이터의
            최신성과 이용자의 승인 상태를 확인하며, 필요한 경우 데이터를
            갱신하거나 삭제합니다. 법령에 따라 보존해야 하는 정보는 해당 기간
            동안 별도로 분리하여 보관합니다.
          </li>
          <li>
            연동 해제, 접근 권한 취소 및 데이터 삭제
            <br /> 이용자는 서비스 내 채널 연동 해제 또는 회원 탈퇴 기능을
            이용하거나, 가입 이메일과 연결 채널 정보를 기재하여
            inflaceproject@gmail.com으로 요청함으로써 저장된 YouTube 관련
            데이터의 삭제를 요구할 수 있습니다. 회사는 본인 확인 후 OAuth 인증
            토큰과 저장된 YouTube 관련 데이터를 지체 없이 삭제하며, 특별한
            사유가 없는 한 요청 또는 권한 취소일로부터 7일 이내에 처리합니다.
            <br /> 이용자는 Google 계정 연결 관리(
            <a
              href='https://myaccount.google.com/connections?filters=3,4&hl=ko)'
              target='_blank'
              rel='noopener noreferrer'
              className='text-blue-600 underline underline-offset-2 hover:text-blue-700'>
              https://myaccount.google.com/connections?filters=3,4&hl=ko)
            </a>
            에서 INFLACE의 접근 권한을 직접 취소할 수 있습니다. 권한이 취소되면
            신규 데이터 수집이 중단되고, 회사는 관련 저장 데이터를 위 절차에
            따라 삭제합니다.
            <br /> INFLACE에 저장된 데이터를 삭제하더라도 YouTube 자체에
            게시되거나 저장된 데이터는 삭제되지 않습니다. 해당 데이터는 이용자가
            YouTube에서 직접 삭제해야 합니다.
          </li>
        </ol>
      </LegalSection>
    </LegalDocument>
  )
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className='overflow-x-auto'>
      <table className='w-full border-collapse text-base'>
        <thead>
          <tr className='border-b border-gray-300 bg-gray-50'>
            {headers.map((header) => (
              <th
                key={header}
                className='border border-gray-200 px-16 py-12 text-left font-semibold text-gray-900'>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className='border-b border-gray-200'>
              {row.map((cell, cellIdx) => (
                <td
                  key={cellIdx}
                  className='border border-gray-200 px-16 py-12 leading-24 text-gray-700'>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Callout({
  variant,
  className,
  children,
}: {
  variant: 'info' | 'warning'
  className?: string
  children: React.ReactNode
}) {
  const styles = {
    info: 'border-l-blue-400 bg-blue-50 text-gray-700',
    warning: 'border-l-amber-400 bg-amber-50 text-gray-800',
  }
  const icon = variant === 'warning' ? '⚠️' : 'ℹ️'
  return (
    <div
      className={`rounded-md border-l-4 px-16 py-12 leading-28 ${styles[variant]} ${className ?? ''}`}>
      <span className='mr-8'>{icon}</span>
      {children}
    </div>
  )
}
