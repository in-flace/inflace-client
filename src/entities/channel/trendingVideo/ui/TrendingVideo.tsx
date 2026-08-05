import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table'
import type { TrendingVideoResponseDto } from '../model/types'
import Image from 'next/image'
import { formatComma, formatPercent } from '@/shared/lib/format'

interface Props {
  data: TrendingVideoResponseDto[]
}

export function TrendingVideo({ data }: Props) {
  // 데이터 부족한 경우 화면
  if (data.length === 0) {
    return (
      <div className='flex h-[58.4rem] w-full items-center justify-center'>
        <span className='text-noto-body-xs-normal text-text-and-icon-primary'>
          더 정확한 결과를 제공하기 위해 데이터를 수집중이에요
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
          <TableHead className='w-[12.68%]'>조회수</TableHead>
          <TableHead className='w-[12.68%]'>참여율</TableHead>
          <TableHead className='w-[12.68%]'>CTR</TableHead>
          <TableHead className='w-[12.68%]'>시청 유지율</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item) => (
          <TableRow key={item.videoId}>
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
            <TableCell>{formatComma(item.viewCount)}</TableCell>
            <TableCell>{formatPercent(item.engagementRate)}%</TableCell>
            <TableCell>{formatPercent(item.ctr)}%</TableCell>
            <TableCell>{formatPercent(item.retentionRate)}%</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
