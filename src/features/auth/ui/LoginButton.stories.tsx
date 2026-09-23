import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { CURRENT_USER_QUERY_KEY, useAuthStore } from '@/entities/user'
import { mockAccessToken, mockUser } from '@/entities/user/mock/mockUser'
import { queryClient } from '@/shared/lib/queryClient'
import { LoginButton } from './LoginButton'

const meta = {
  title: 'Features/Auth/LoginButton',
  component: LoginButton,
  tags: ['autodocs'],
} satisfies Meta<typeof LoginButton>

export default meta
type Story = StoryObj<typeof meta>

export const Loading: Story = {
  decorators: [
    (Story) => {
      useAuthStore.setState({
        accessToken: null,
        isInitializing: true,
      })
      queryClient.removeQueries({ queryKey: CURRENT_USER_QUERY_KEY })
      return <Story />
    },
  ],
}

export const LoggedOut: Story = {
  decorators: [
    (Story) => {
      useAuthStore.setState({
        accessToken: null,
        isInitializing: false,
      })
      queryClient.removeQueries({ queryKey: CURRENT_USER_QUERY_KEY })
      return <Story />
    },
  ],
}

export const LoggedIn: Story = {
  decorators: [
    (Story) => {
      useAuthStore.setState({
        accessToken: mockAccessToken,
        isInitializing: false,
      })
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, mockUser)
      return <Story />
    },
  ],
}
