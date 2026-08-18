import * as React from 'react'

/* SearchBar는 controlled 전용이다.
 * X 버튼 노출이 value prop에 걸려 있어서(SearchBar.tsx의 `{value && ...}`),
 * value 없이 defaultValue만 넘기면 글자는 입력되는데 X 버튼이 끝까지 나타나지 않는다.
 * 이전 타입은 ComponentProps<'input'>을 그대로 써서 그 사용법이 컴파일됐다.
 * defaultValue를 빼고 value/onChange를 필수로 만들어 타입에서 막는다. */
export type InputProps = Omit<
  React.ComponentProps<'input'>,
  'value' | 'defaultValue' | 'onChange'
> & {
  value: string
  onChange: React.ChangeEventHandler<HTMLInputElement>
  onClear?: () => void
}
