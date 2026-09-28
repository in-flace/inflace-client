import type { ReactNode } from 'react'
import Image from 'next/image'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table'

export interface VideoTableColumn<T> {
  label: string
  /* 폭 클래스. 미지정 시 지표 컬럼 기본값(w-[12.68%])을 쓴다. */
  width?: string
  render: (item: T) => ReactNode
}

interface VideoTableProps<T extends { thumbnailUrl: string; title: string }> {
  data: T[]
  getRowKey: (item: T) => string | number
  columns: VideoTableColumn<T>[]
  emptyMessage?: string
}

/* 썸네일 + 제목 + 지표 컬럼들로 구성된 채널 분석 영상 리스트 표.
 * TrendingVideo/NewInflow/TypeEngagementList가 지표 컬럼 구성만 다르고
 * 나머지 마크업이 전부 같아서 공통으로 뽑았다. */
export function VideoTable<T extends { thumbnailUrl: string; title: string }>({
  data,
  getRowKey,
  columns,
  emptyMessage = '더 정확한 결과를 제공하기 위해 데이터를 수집중이에요',
}: VideoTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className='flex h-[58.4rem] w-full items-center justify-center'>
        <span className='text-noto-body-xs-normal text-text-and-icon-primary'>
          {emptyMessage}
        </span>
      </div>
    )
  }

  return (
    <Table className='w-full table-fixed'>
      <TableHeader>
        <TableRow>
          <TableHead className='w-[15.6rem]'>썸네일</TableHead>
          <TableHead>제목</TableHead>
          {columns.map((column) => (
            <TableHead key={column.label} className={column.width ?? 'w-[12.68%]'}>
              {column.label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item) => (
          <TableRow key={getRowKey(item)}>
            <TableCell>
              <div className='relative h-[8.8rem] overflow-hidden rounded-4'>
                <Image
                  src={item.thumbnailUrl}
                  alt={item.title}
                  fill
                  sizes='156px'
                  className='object-cover'
                />
              </div>
            </TableCell>
            <TableCell className='text-left'>{item.title}</TableCell>
            {columns.map((column) => (
              <TableCell key={column.label}>{column.render(item)}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
