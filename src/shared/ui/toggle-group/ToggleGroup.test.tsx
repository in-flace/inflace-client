import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'

import { ToggleGroup, ToggleGroupItem } from './ToggleGroup'

/* 이 파일은 ToggleGroup.tsx가 소유한 것만 검증한다.
 * 선택 규칙(single/multiple), 키보드 이동, ARIA role, disabled 처리는
 * Radix의 동작이며 Radix가 자기 테스트로 이미 검증한다. 여기서 다시 단언하면
 * 라이브러리 업그레이드마다 우리 테스트가 깨질 뿐 우리 회귀는 잡지 못한다.
 *
 * 우리 것은 셋이다 — size 해석(size ?? context.size ?? 'lg'),
 * imgSrc 조건부 렌더, className/data-* 전달.
 * 여기에 Radix 배선이 살아 있는지 보는 스모크 1건을 더한다.
 *
 * 크기·배치 클래스(h-[8.6rem], rounded-full, flex-col)는 단언하지 않는다.
 * 토큰 이관으로 값이 바뀌면 동작이 멀쩡해도 깨지고, 같은 것을 Chromatic이
 * SizeOverview / Vertical / WithIconTop 스토리로 이미 검증한다. */

// next/image는 테스트 환경에서 일반 img 태그로 대체
vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    fill: _fill,
    ...props
  }: {
    src: string
    alt: string
    fill?: boolean
    [key: string]: unknown
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}))

/* role로 조회하면 Radix에 묶인다(single이면 radiogroup, multiple이면 toolbar).
 * data-slot은 우리 컴포넌트가 직접 붙이는 값이라 type과 무관하게 안정적이다. */
const getGroup = (container: HTMLElement) =>
  container.querySelector('[data-slot="toggle-group"]')!
const getItems = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('[data-slot="toggle-group-item"]'))

describe('ToggleGroup', () => {
  describe('전달', () => {
    it('추가 className이 ToggleGroup에 병합된다', () => {
      const { container } = render(
        <ToggleGroup type='single' className='custom-class'>
          <ToggleGroupItem value='a'>옵션 A</ToggleGroupItem>
        </ToggleGroup>
      )
      expect(getGroup(container)).toHaveClass('custom-class')
    })

    /* 배치는 flex-col/flex-row가 아니라 data-orientation으로 단언한다.
     * 클래스는 레이아웃 구현 수단이지만 data-orientation은 CSS와 소비자가
     * 함께 의존하는 계약이라 스타일을 바꿔도 유지된다. */
    it('orientation이 data-orientation으로 노출된다', () => {
      const { container } = render(
        <ToggleGroup type='single' orientation='vertical'>
          <ToggleGroupItem value='a'>옵션 A</ToggleGroupItem>
        </ToggleGroup>
      )
      expect(getGroup(container)).toHaveAttribute(
        'data-orientation',
        'vertical'
      )
    })

    it('orientation 기본값은 horizontal이다', () => {
      const { container } = render(
        <ToggleGroup type='single'>
          <ToggleGroupItem value='a'>옵션 A</ToggleGroupItem>
        </ToggleGroup>
      )
      expect(getGroup(container)).toHaveAttribute(
        'data-orientation',
        'horizontal'
      )
    })
  })

  /* size는 아이템 prop -> 그룹 컨텍스트 -> lg 순으로 해석된다.
   * 결과값 자체는 data-size로 드러나므로 클래스를 보지 않고 확인할 수 있다. */
  describe('size 해석', () => {
    it('아이템에 size가 없으면 그룹의 size를 물려받는다', () => {
      const { container } = render(
        <ToggleGroup type='single' size='fit'>
          <ToggleGroupItem value='a'>옵션 A</ToggleGroupItem>
        </ToggleGroup>
      )
      expect(getItems(container)[0]).toHaveAttribute('data-size', 'fit')
    })

    it('아이템의 size가 그룹의 size보다 우선한다', () => {
      const { container } = render(
        <ToggleGroup type='single' size='lg'>
          <ToggleGroupItem value='a' size='fit'>
            옵션 A
          </ToggleGroupItem>
        </ToggleGroup>
      )
      expect(getItems(container)[0]).toHaveAttribute('data-size', 'fit')
    })

    it('둘 다 없으면 lg로 해석된다', () => {
      const { container } = render(
        <ToggleGroup type='single'>
          <ToggleGroupItem value='a'>옵션 A</ToggleGroupItem>
        </ToggleGroup>
      )
      expect(getItems(container)[0]).toHaveAttribute('data-size', 'lg')
    })
  })

  describe('이미지', () => {
    it('imgSrc 전달 시 img 요소가 렌더링된다', () => {
      render(
        <ToggleGroup type='single'>
          <ToggleGroupItem value='a' imgSrc='/test-icon.png' imgAlt='아이콘'>
            옵션 A
          </ToggleGroupItem>
        </ToggleGroup>
      )
      expect(screen.getByRole('img')).toBeInTheDocument()
    })

    it('imgAlt가 img 요소에 전달된다', () => {
      render(
        <ToggleGroup type='single'>
          <ToggleGroupItem value='a' imgSrc='/test-icon.png' imgAlt='아이콘'>
            옵션 A
          </ToggleGroupItem>
        </ToggleGroup>
      )
      expect(screen.getByAltText('아이콘')).toBeInTheDocument()
    })

    it('imgSrc 미전달 시 img 요소가 렌더링되지 않는다', () => {
      render(
        <ToggleGroup type='single'>
          <ToggleGroupItem value='a'>옵션 A</ToggleGroupItem>
        </ToggleGroup>
      )
      expect(screen.queryByRole('img')).toBeNull()
    })
  })

  /* Radix 선택 규칙을 다시 검증하려는 게 아니라, 우리가 Radix를 붙인 방식이
   * 살아 있는지만 본다. 컨텍스트 Provider 위치가 어긋나거나 {...props}
   * 스프레드가 빠지면 클릭이 아예 먹지 않는데 그건 우리 회귀다.
   * data-state는 컴포넌트 CSS가 직접 의존하는 값이라 관찰 대상으로 적절하다. */
  it('아이템을 클릭하면 선택 상태가 반영된다', async () => {
    const { container } = render(
      <ToggleGroup type='single'>
        <ToggleGroupItem value='a'>옵션 A</ToggleGroupItem>
      </ToggleGroup>
    )
    const item = getItems(container)[0]

    expect(item).toHaveAttribute('data-state', 'off')
    await userEvent.click(item)
    expect(item).toHaveAttribute('data-state', 'on')
  })
})
