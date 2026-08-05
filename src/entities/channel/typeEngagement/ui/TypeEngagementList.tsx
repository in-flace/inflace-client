import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table'
import type { TypeEngagementVideoDto } from '../model/types'
import Image from 'next/image'
import { formatPercent } from '@/shared/lib/format'

interface Props {
  data: TypeEngagementVideoDto[]
}

export function TypeEngagementList({ data }: Props) {
  return (
    <Table className='w-full table-fixed'>
      <TableHeader>
        <TableRow>
          <TableHead className='w-[15.6rem]'>썸네일</TableHead>
          <TableHead>제목</TableHead>
          <TableHead className='w-[12.4rem]'>롱폼/숏폼</TableHead>
          <TableHead className='w-[14.8rem]'>참여율</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item) => (
          <TableRow key={item.rank}>
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
            <TableCell className='text-left'>
              <span className='line-clamp-2'>{item.title}</span>
            </TableCell>
            <TableCell>
              {item.contentType === 'LONG_FORM' ? '롱폼' : '숏폼'}
            </TableCell>
            <TableCell>{formatPercent(item.engagementRate)}%</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
