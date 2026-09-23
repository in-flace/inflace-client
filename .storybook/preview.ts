import type { Preview } from '@storybook/nextjs-vite'
import { createElement } from 'react'

import { QueryProvider } from '../src/app/providers/QueryProvider'
import '../src/app/styles'

const preview: Preview = {
  /* useAuth 등 react-query 훅을 쓰는 스토리가 여럿이라 앱과 동일한 QueryProvider를 전역으로 감싼다.
   * 공용 queryClient 인스턴스라 스토리에서 setQueryData로 상태를 심을 수 있다. */
  decorators: [(Story) => createElement(QueryProvider, null, createElement(Story))],
  parameters: {
    nextjs: {
      appDirectory: true,
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
    options: {
      storySort: {
        order: ['Pages', 'Widgets', 'Features', 'Entities', 'Shared'],
      },
    },
  },
}

export default preview
