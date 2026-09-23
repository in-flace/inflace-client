import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { AdminSidebar } from './AdminSidebar'

const meta = {
  title: 'Features/Admin/AdminSidebar',
  component: AdminSidebar,
  tags: ['autodocs'],
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/tljgpVOJusj7aZSHQFfrB8/-PM--%EC%99%80%EC%9D%B4%EC%96%B4%ED%94%84%EB%A0%88%EC%9E%84?node-id=4324-17869',
    },
    nextjs: { navigation: { pathname: '/admin/brands' } },
  },
  decorators: [
    (Story) => (
      <div className='bg-background-gray-default'>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AdminSidebar>

export default meta
type Story = StoryObj<typeof meta>

export const BrandReviewActive: Story = {}

export const FeedbackActive: Story = {
  parameters: { nextjs: { navigation: { pathname: '/admin/feedbacks' } } },
}
