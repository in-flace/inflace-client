import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import Image from 'next/image'
import mockImage from './assets/mock/mock-image.png'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table'
import { mockVideoList } from '@/shared/mock/mockVideoList'

const meta: Meta = {
  title: 'Shared/Table',
  tags: ['autodocs'],

  decorators: [
    (Story) => (
      <div className='w-436 overflow-x-auto'>
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof meta>

export const WithThumbnail: Story = {
  name: '이미지 포함 테이블',

  render: () => (
    <Table className='w-full table-fixed'>
      <TableHeader>
        <TableRow>
          <TableHead className='w-39'>썸네일</TableHead>
          <TableHead>제목</TableHead>
          <TableHead className='w-[12.7%]'>조회수</TableHead>
          <TableHead className='w-[12.7%]'>참여율</TableHead>
          <TableHead className='w-[12.7%]'>CTR</TableHead>
          <TableHead className='w-[12.7%]'>시청 유지율</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {mockVideoList.map((data) => (
          <TableRow key={data.rank}>
            <TableCell>
              <div className='relative h-[8.8rem] overflow-hidden rounded-4'>
                <Image
                  src={mockImage.src}
                  alt={data.title}
                  fill
                  sizes='156px'
                  className='object-cover'
                />
              </div>
            </TableCell>
            <TableCell className='text-left'>{data.title}</TableCell>
            <TableCell>{data.viewCount.toLocaleString()}</TableCell>
            <TableCell>{data.engagementRate}%</TableCell>
            <TableCell>{data.ctr}%</TableCell>
            <TableCell>{data.retentionRate}%</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
}

export const WithoutThumbnail: Story = {
  name: '이미지 미포함 테이블',

  render: () => (
    <Table className='w-full table-fixed'>
      <TableHeader>
        <TableRow>
          <TableHead className='w-39'>썸네일</TableHead>
          <TableHead>제목</TableHead>
          <TableHead className='w-[12.7%]'>조회수</TableHead>
          <TableHead className='w-[12.7%]'>참여율</TableHead>
          <TableHead className='w-[12.7%]'>CTR</TableHead>
          <TableHead className='w-[12.7%]'>시청 유지율</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {mockVideoList.map((data) => (
          <TableRow key={data.rank}>
            <TableCell className='w-72'>{data.rank}</TableCell>
            <TableCell className='text-left'>{data.title}</TableCell>
            <TableCell>{data.viewCount.toLocaleString()}</TableCell>
            <TableCell>{data.engagementRate}%</TableCell>
            <TableCell>{data.ctr}%</TableCell>
            <TableCell>{data.retentionRate}%</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
}

export const SidebarCollapsed: Story = {
  name: '사이드바 닫힘',

  render: () => (
    <div className='w-391 overflow-x-auto'>
      <Table className='w-full table-fixed'>
        <TableHeader>
          <TableRow>
            <TableHead className='w-39'>썸네일</TableHead>
            <TableHead>제목</TableHead>
            <TableHead className='w-[12.7%]'>조회수</TableHead>
            <TableHead className='w-[12.7%]'>참여율</TableHead>
            <TableHead className='w-[12.7%]'>CTR</TableHead>
            <TableHead className='w-[12.7%]'>시청 유지율</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mockVideoList.map((data) => (
            <TableRow key={data.rank}>
              <TableCell>
                <div className='relative h-[8.8rem] overflow-hidden rounded-4'>
                  <Image
                    src={mockImage.src}
                    alt={data.title}
                    fill
                    sizes='156px'
                    className='object-cover'
                  />
                </div>
              </TableCell>
              <TableCell className='text-left'>{data.title}</TableCell>
              <TableCell>{data.viewCount.toLocaleString()}</TableCell>
              <TableCell>{data.engagementRate}%</TableCell>
              <TableCell>{data.ctr}%</TableCell>
              <TableCell>{data.retentionRate}%</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  ),
}
