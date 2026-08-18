import { describe, it, expect, afterEach, vi } from 'vitest'

import {
  formatComma,
  formatPercent,
  formatDecimal,
  formatKoreanUnit,
  formatThousands,
  format10Thousands,
  formatYAxisPercent,
  getViewCvLabel,
  formatDate,
  formatMonthAgo,
  formatDuration,
  formatMonthAndWeek,
} from './format'

/* 특성화 테스트(characterization test).
 *
 * 폴더 구조 개편과 VideoCard 통합을 앞두고 현재 동작을 그대로 고정하는 것이 목적이다.
 * 따라서 "이래야 한다"가 아니라 "지금 이렇다"를 단언한다.
 * 현재 동작이 의도와 어긋나 보이는 지점은 BUG 주석으로 표시했으며,
 * 수정 여부를 결정하기 전까지는 실제 동작에 맞춰 통과시킨다.
 *
 * 날짜 입력은 타임존 접미사 없는 LocalDateTime 문자열(백엔드 규약)만 사용한다.
 * 이 형식은 로컬 시각으로 파싱되어 입력 구성요소가 그대로 되돌아오므로
 * 실행 환경의 타임존과 무관하게 결과가 같다.
 */

describe('formatComma', () => {
  it('천 단위마다 쉼표를 넣는다', () => {
    expect(formatComma(1000000)).toBe('1,000,000')
    expect(formatComma(1234)).toBe('1,234')
  })

  it('세 자리 미만은 그대로 둔다', () => {
    expect(formatComma(0)).toBe('0')
    expect(formatComma(999)).toBe('999')
  })

  it('null과 undefined를 0으로 방어한다', () => {
    expect(formatComma(null)).toBe('0')
    expect(formatComma(undefined)).toBe('0')
  })

  it('음수도 쉼표를 유지한다', () => {
    expect(formatComma(-1234)).toBe('-1,234')
  })
})

describe('formatPercent', () => {
  it('소수점을 버리고 정수로 만든다', () => {
    expect(formatPercent(82.345)).toBe('82')
    expect(formatPercent(0)).toBe('0')
  })

  it('반올림한다 (버림이 아니다)', () => {
    expect(formatPercent(82.5)).toBe('83')
    expect(formatPercent(82.6)).toBe('83')
  })

  it('null·undefined·NaN을 0으로 방어한다', () => {
    expect(formatPercent(null)).toBe('0')
    expect(formatPercent(undefined)).toBe('0')
    expect(formatPercent(NaN)).toBe('0')
  })

  // BUG 후보: 0으로 반올림되는 음수가 '-0'으로 표시된다.
  it('0으로 반올림되는 음수는 -0을 출력한다', () => {
    expect(formatPercent(-0.4)).toBe('-0')
  })
})

describe('formatDecimal', () => {
  it('소수 둘째 자리까지 반올림한다', () => {
    expect(formatDecimal(3.456)).toBe('3.46')
    expect(formatDecimal(3.5)).toBe('3.50')
  })

  it('아래 두 자리가 모두 0이면 정수로 표시한다', () => {
    expect(formatDecimal(3)).toBe('3')
    expect(formatDecimal(3.001)).toBe('3')
    expect(formatDecimal(0)).toBe('0')
  })

  it('null·undefined·NaN을 0으로 방어한다', () => {
    expect(formatDecimal(null)).toBe('0')
    expect(formatDecimal(undefined)).toBe('0')
    expect(formatDecimal(NaN)).toBe('0')
  })
})

describe('formatKoreanUnit', () => {
  it('만 단위와 나머지를 함께 표기한다', () => {
    expect(formatKoreanUnit(37687938)).toBe('3768만 7938')
    expect(formatKoreanUnit(83904)).toBe('8만 3904')
  })

  it('나머지가 0이면 만 단위만 표기한다', () => {
    expect(formatKoreanUnit(20000)).toBe('2만')
    expect(formatKoreanUnit(10000)).toBe('1만')
  })

  it('만 미만은 그대로 둔다', () => {
    expect(formatKoreanUnit(187)).toBe('187')
    expect(formatKoreanUnit(9999)).toBe('9999')
    expect(formatKoreanUnit(0)).toBe('0')
  })

  it('소수는 버린다', () => {
    expect(formatKoreanUnit(9999.9)).toBe('9999')
  })

  // BUG 후보: 음수는 만 단위 분기를 타지 못해 원본이 그대로 나온다.
  it('음수는 만 단위로 축약되지 않는다', () => {
    expect(formatKoreanUnit(-20000)).toBe('-20000')
  })
})

describe('formatThousands', () => {
  // BUG 후보: JSDoc은 "3,700 => 3천"이라고 적혀 있으나 실제로는 소수 첫째 자리가 남는다.
  it('천 단위를 소수 첫째 자리까지 표기한다', () => {
    expect(formatThousands(3700)).toBe('3.7천')
  })

  // BUG 후보: format10Thousands는 정수일 때 소수를 떼는데(1만) 이 함수는 떼지 않는다(1.0천).
  it('정확히 나누어떨어져도 .0을 남긴다', () => {
    expect(formatThousands(1000)).toBe('1.0천')
    expect(formatThousands(5000)).toBe('5.0천')
  })

  it('천 미만은 그대로 둔다', () => {
    expect(formatThousands(999)).toBe('999')
    expect(formatThousands(0)).toBe('0')
  })
})

describe('format10Thousands', () => {
  it('만 단위를 소수 첫째 자리까지 표기한다', () => {
    expect(format10Thousands(285000)).toBe('28.5만')
  })

  it('정확히 나누어떨어지면 소수를 떼어낸다', () => {
    expect(format10Thousands(300000)).toBe('30만')
    expect(format10Thousands(10000)).toBe('1만')
  })

  it('만 미만은 그대로 둔다', () => {
    expect(format10Thousands(9999)).toBe('9999')
    expect(format10Thousands(0)).toBe('0')
  })
})

describe('formatYAxisPercent', () => {
  const ticks = [0, 25, 50, 75, 100]

  it('눈금 위치를 퍼센트 라벨로 바꾼다', () => {
    expect(formatYAxisPercent(0, ticks)).toBe('0')
    expect(formatYAxisPercent(25, ticks)).toBe('25%')
    expect(formatYAxisPercent(50, ticks)).toBe('50%')
    expect(formatYAxisPercent(75, ticks)).toBe('75%')
    expect(formatYAxisPercent(100, ticks)).toBe('100%')
  })

  it('눈금 값이 실제 데이터 범위여도 위치 기준으로 라벨을 붙인다', () => {
    expect(formatYAxisPercent(120, [0, 120, 240, 360, 480])).toBe('25%')
  })

  it('눈금에 없는 값은 숫자 그대로 반환한다', () => {
    expect(formatYAxisPercent(30, ticks)).toBe('30')
  })

  it('눈금 배열이 비어 있으면 숫자 그대로 반환한다', () => {
    expect(formatYAxisPercent(42, [])).toBe('42')
  })
})

describe('getViewCvLabel', () => {
  it('0.4 미만은 매우 안정이다', () => {
    expect(getViewCvLabel(0)).toBe('매우 안정')
    expect(getViewCvLabel(0.39)).toBe('매우 안정')
  })

  it('0.4 이상 1.8 이하는 안정이다', () => {
    expect(getViewCvLabel(0.4)).toBe('안정')
    expect(getViewCvLabel(1.8)).toBe('안정')
  })

  it('1.8 초과는 불안정이다', () => {
    expect(getViewCvLabel(1.81)).toBe('불안정')
  })

  // BUG 후보: NaN이 두 비교를 모두 통과하지 못해 '불안정'으로 분류된다.
  it('NaN을 불안정으로 분류한다', () => {
    expect(getViewCvLabel(NaN)).toBe('불안정')
  })
})

describe('formatDate', () => {
  it('연·월·일·시·분을 두 자리로 채워 반환한다', () => {
    expect(formatDate('2025-01-14T09:30:00')).toEqual({
      year: '2025',
      month: '01',
      day: '14',
      hour: '09',
      minute: '30',
    })
  })

  it('두 자리 값은 그대로 유지한다', () => {
    expect(formatDate('2025-12-25T23:59:00')).toEqual({
      year: '2025',
      month: '12',
      day: '25',
      hour: '23',
      minute: '59',
    })
  })

  // BUG 후보: formatMonthAgo에는 NaN 가드가 있으나 이 함수에는 없어 'NaN'이 화면에 노출된다.
  it('잘못된 문자열에 NaN 문자열을 반환한다', () => {
    expect(formatDate('올바르지 않은 날짜')).toEqual({
      year: 'NaN',
      month: 'NaN',
      day: 'NaN',
      hour: 'NaN',
      minute: 'NaN',
    })
  })
})

describe('formatMonthAgo', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  const freeze = (iso: string) => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(iso))
  }

  it('12개월 이상은 년 단위로 반환한다', () => {
    freeze('2026-06-01T00:00:00')
    expect(formatMonthAgo('2025-01-14T00:00:00')).toBe('1년 전')
  })

  it('12개월 미만은 개월 단위로 반환한다', () => {
    freeze('2026-06-01T00:00:00')
    expect(formatMonthAgo('2026-01-01T00:00:00')).toBe('5개월 전')
  })

  it('같은 달이면 0개월 전이다', () => {
    freeze('2026-06-20T00:00:00')
    expect(formatMonthAgo('2026-06-01T00:00:00')).toBe('0개월 전')
  })

  it('일자가 아직 지나지 않았으면 한 달을 빼서 센다', () => {
    freeze('2026-06-10T00:00:00')
    expect(formatMonthAgo('2026-05-20T00:00:00')).toBe('0개월 전')
  })

  it('년 단위로 넘어갈 때 나머지 개월은 버린다', () => {
    freeze('2026-06-01T00:00:00')
    expect(formatMonthAgo('2024-07-01T00:00:00')).toBe('1년 전')
  })

  it('미래 날짜는 0개월 전으로 고정한다', () => {
    freeze('2026-06-01T00:00:00')
    expect(formatMonthAgo('2027-01-01T00:00:00')).toBe('0개월 전')
  })

  it('잘못된 문자열에 하이픈을 반환한다', () => {
    freeze('2026-06-01T00:00:00')
    expect(formatMonthAgo('올바르지 않은 날짜')).toBe('-')
  })
})

describe('formatDuration', () => {
  it('초를 분:초로 변환한다', () => {
    expect(formatDuration(769)).toBe('12:49')
    expect(formatDuration(59)).toBe('0:59')
    expect(formatDuration(60)).toBe('1:00')
    expect(formatDuration(0)).toBe('0:00')
  })

  it('소수 초는 반올림한다', () => {
    expect(formatDuration(59.6)).toBe('1:00')
  })

  it('null·undefined·NaN에 하이픈을 반환한다', () => {
    expect(formatDuration(null)).toBe('-')
    expect(formatDuration(undefined)).toBe('-')
    expect(formatDuration(NaN)).toBe('-')
  })

  // BUG: 시간 단위를 처리하지 않아 1시간 이상 영상이 60분을 넘는 분으로 표시된다.
  // 유튜브 롱폼에서 흔한 길이이므로 실제 화면에 노출된다. (h:mm:ss 필요)
  it('1시간 이상을 시간으로 올리지 않는다', () => {
    expect(formatDuration(3600)).toBe('60:00')
    expect(formatDuration(7325)).toBe('122:05')
  })

  // BUG 후보: 음수 입력이 방어되지 않아 형식이 깨진다.
  it('음수 입력에 깨진 형식을 반환한다', () => {
    expect(formatDuration(-30)).toBe('-1:-30')
  })
})

describe('formatMonthAndWeek', () => {
  /* 일요일 시작 기준. 2025-01-01은 수요일이므로
   * 1주차 = 1/1(수)~1/4(토), 2주차 = 1/5(일)~1/11(토), 3주차 = 1/12(일)~1/18(토).
   *
   * BUG: 함수의 JSDoc 예시는 "2025-01-14 => {1, 2}"라고 적혀 있으나
   * 위 기준대로면 1/14(화)는 3주차이고 실제 반환값도 3이다. 주석 쪽이 틀렸다.
   * 주석을 근거로 함수를 고치면 오히려 회귀가 된다.
   */
  it('일요일 시작 기준으로 주차를 계산한다', () => {
    expect(formatMonthAndWeek('2025-01-14T00:00:00')).toEqual({
      month: 1,
      weekNumber: 3,
    })
  })

  it('달의 첫날은 1주차다', () => {
    expect(formatMonthAndWeek('2025-01-01T00:00:00')).toEqual({
      month: 1,
      weekNumber: 1,
    })
  })

  it('첫 주가 끝나는 토요일까지 1주차다', () => {
    expect(formatMonthAndWeek('2025-01-04T00:00:00')).toEqual({
      month: 1,
      weekNumber: 1,
    })
  })

  it('첫 일요일부터 2주차가 시작된다', () => {
    expect(formatMonthAndWeek('2025-01-05T00:00:00')).toEqual({
      month: 1,
      weekNumber: 2,
    })
  })

  it('달이 일요일로 시작하면 첫날부터 1주차다', () => {
    // 2025-06-01은 일요일
    expect(formatMonthAndWeek('2025-06-01T00:00:00')).toEqual({
      month: 6,
      weekNumber: 1,
    })
    expect(formatMonthAndWeek('2025-06-08T00:00:00')).toEqual({
      month: 6,
      weekNumber: 2,
    })
  })

  it('월을 1부터 세어 반환한다', () => {
    expect(formatMonthAndWeek('2025-12-25T00:00:00').month).toBe(12)
  })
})
