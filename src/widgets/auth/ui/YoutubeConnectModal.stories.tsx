import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { useYoutubeConnectModal } from '@/features/channelConnect'
import { YoutubeConnectModal } from './YoutubeConnectModal'

const meta = {
  title: 'Widgets/Auth/YoutubeConnectModal',
  component: YoutubeConnectModal,
  tags: ['autodocs'],
} satisfies Meta<typeof YoutubeConnectModal>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {
  decorators: [
    (Story) => {
      useYoutubeConnectModal.setState({ isOpen: true })
      return <Story />
    },
  ],
  parameters: {
    docs: {
      description: {
        story: '데스크탑(lg 이상)에서 이미지 영역이 노출되는 기본 상태입니다.',
      },
    },
  },
}

export const OpenMobile: Story = {
  decorators: [
    (Story) => {
      useYoutubeConnectModal.setState({ isOpen: true })
      return <Story />
    },
  ],
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          '모바일 뷰포트에서는 이미지 영역이 숨겨지고 제목, 설명, 버튼, 나중에 할래요 링크만 노출됩니다.',
      },
    },
  },
}

/*
 * WithError: usePopupOAuth의 error 상태를 표시하려면 내부 훅을 제어해야 한다.
 * 실제 팝업 차단이 발생하지 않으므로, 버튼 클릭 전 상태로 에러 텍스트를 확인하려면
 * vi.mock 기반 Storybook 테스트 환경이 필요하다.
 */
export const WithError: Story = {
  decorators: [
    (Story) => {
      useYoutubeConnectModal.setState({ isOpen: true })
      return <Story />
    },
  ],
  parameters: {
    docs: {
      description: {
        story:
          '팝업이 차단되었을 때 에러 메시지가 표시되는 상태입니다. 실제 에러를 트리거하려면 브라우저 팝업 차단을 활성화한 후 연동 버튼을 클릭하세요.',
      },
    },
  },
}
