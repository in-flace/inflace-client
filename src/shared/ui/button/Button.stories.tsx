import type React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Button } from './Button'

const ZapBold = () => (
  <svg
    width='24'
    height='24'
    viewBox='0 0 24 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'>
    <path
      d='M11.2135 2.46349C11.6763 1.96602 12.3578 1.89055 12.8873 2.13634C13.4053 2.37709 13.7738 2.91646 13.7506 3.55823L13.7408 3.68811L13.1236 8.97039H19.525C20.1862 8.97069 20.6656 9.39332 20.8707 9.862C21.0747 10.328 21.0545 10.9319 20.6764 11.4167L20.6774 11.4177L12.8756 21.4305L12.8746 21.4315C12.4139 22.021 11.6774 22.1264 11.1119 21.8641C10.5584 21.6071 10.1759 21.009 10.2594 20.3104L10.8756 15.029H4.47514C3.8136 15.029 3.33468 14.6063 3.12943 14.1374C2.92523 13.6709 2.94351 13.0659 3.32279 12.5808L11.1236 2.56896L11.2135 2.46349ZM5.50933 13.029H11.4625C12.4163 13.0293 13.0213 13.8901 12.9254 14.7136L12.9264 14.7146L12.4596 18.7088L18.4908 10.9704H12.5367C11.5813 10.9704 10.9759 10.1076 11.0738 9.2829L11.5396 5.28872L5.50933 13.029Z'
      fill='currentColor'
    />
  </svg>
)

const meta: Meta<typeof Button> = {
  title: 'Shared/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/zPupSufnlb9xmEdfs4vkql/-PD--inflace?node-id=378-747',
    },
  },
  argTypes: {
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'gray'],
      description: '버튼 색상 테마',
    },
    size: {
      control: 'select',
      options: ['lg', 'md', 'sm', 'xs'],
      description: '버튼 크기',
    },
    variant: {
      control: 'select',
      options: ['filled', 'outlined'],
      description: '버튼 스타일 (gray는 filled만 지원)',
    },
    leftIcon: {
      control: false,
      description: '왼쪽 아이콘 (ReactNode)',
    },
    rightIcon: {
      control: false,
      description: '오른쪽 아이콘 (ReactNode)',
    },
    disabled: {
      control: 'boolean',
      description: '비활성화 상태',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

const sizes = ['lg', 'md', 'sm', 'xs'] as const
const variants = [
  { color: 'gray', variant: 'filled' },
  { color: 'primary', variant: 'filled' },
  { color: 'primary', variant: 'outlined' },
  { color: 'secondary', variant: 'filled' },
  { color: 'secondary', variant: 'outlined' },
] as const

const ButtonGrid = ({
  leftIcon,
  rightIcon,
}: {
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}) => (
  <div className='flex flex-col gap-8 p-6'>
    {sizes.map((size) => (
      <div key={size}>
        <p className='mb-3 text-sm text-gray-400'>{size}</p>
        <div className='flex flex-wrap items-center gap-4'>
          {variants.flatMap(({ color, variant }) => [
            <Button
              key={`${color}-${variant}-normal`}
              color={color}
              variant={variant}
              size={size}
              leftIcon={leftIcon}
              rightIcon={rightIcon}>
              레이블
            </Button>,
            <Button
              key={`${color}-${variant}-disabled`}
              color={color}
              variant={variant}
              size={size}
              leftIcon={leftIcon}
              rightIcon={rightIcon}
              disabled>
              레이블
            </Button>,
          ])}
        </div>
      </div>
    ))}
  </div>
)

// 인터랙티브 단일 버튼
export const Default: Story = {
  args: {
    children: '레이블',
    color: 'primary',
    variant: 'filled',
    size: 'lg',
  },
}

// 모든 color × style × size 조합 (5 variants × 4 sizes × normal+disabled = 40가지)
export const Overview: Story = {
  render: () => <ButtonGrid />,
}

// LeftIcon (5 variants × 4 sizes × normal+disabled = 40가지)
export const LeftIcon: Story = {
  render: () => <ButtonGrid leftIcon={<ZapBold />} />,
}

// RightIcon (5 variants × 4 sizes × normal+disabled = 40가지)
export const RightIcon: Story = {
  render: () => <ButtonGrid rightIcon={<ZapBold />} />,
}

// BothIcons (5 variants × 4 sizes × normal+disabled = 40가지)
export const BothIcons: Story = {
  render: () => <ButtonGrid leftIcon={<ZapBold />} rightIcon={<ZapBold />} />,
}
