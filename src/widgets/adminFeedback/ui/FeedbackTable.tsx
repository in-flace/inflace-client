'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table'
import { cn } from '@/shared/lib/utils'
import { formatDate } from '@/shared/lib/format'
import {
  FEEDBACK_STATUS_LABELS,
  useUpdateFeedbackStatus,
  type FeedbackDto,
  type FeedbackStatus,
} from '@/features/admin'

const STATUSES = Object.keys(FEEDBACK_STATUS_LABELS) as FeedbackStatus[]

type Props = {
  feedbacks: FeedbackDto[]
}

export function FeedbackTable({ feedbacks }: Props) {
  const { mutate, isPending } = useUpdateFeedbackStatus()

  return (
    <div className='overflow-hidden rounded-12 border border-stroke-border-gray-stronger'>
      <div className='border-b border-stroke-border-gray-stronger bg-background-gray-default px-16 py-12 text-noto-label-sm-bold text-text-and-icon-secondary'>
        CS 목록
      </div>
      <Table className='table-fixed'>
        <TableHeader>
          <TableRow className='border-b border-stroke-border-gray-stronger'>
            <TableHead className='w-[8%] pl-24 text-left first:pl-24'>
              CS ID
            </TableHead>
            <TableHead className='w-[18%] text-left'>접수 시간</TableHead>
            <TableHead className='w-[16%] text-left'>접수 위치</TableHead>
            <TableHead className='w-[36%] text-left'>접수 내용</TableHead>
            <TableHead className='w-[22%] pr-24 text-right'>
              확인 상태
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {feedbacks.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={5}
                className='py-40 text-text-and-icon-secondary'>
                접수된 문의가 없습니다.
              </TableCell>
            </TableRow>
          )}
          {feedbacks.map((feedback) => {
            const d = formatDate(feedback.createdAt)
            return (
              <TableRow
                key={feedback.id}
                className='border-b border-stroke-border-gray-stronger last:border-b-0'>
                <TableCell className='pl-24 text-left text-text-and-icon-secondary first:pl-24'>
                  CS-{feedback.id}
                </TableCell>
                <TableCell className='text-left whitespace-nowrap'>
                  {d.year.slice(2)}.{d.month}.{d.day} {d.hour}:{d.minute}
                </TableCell>
                <TableCell className='text-left'>
                  {feedback.submissionLocation}
                </TableCell>
                <TableCell className='max-w-[56rem] text-left whitespace-pre-wrap text-text-and-icon-secondary'>
                  {feedback.content}
                </TableCell>
                <TableCell className='pr-24'>
                  <div className='flex shrink-0 justify-end gap-8'>
                    {STATUSES.map((status) => (
                      <button
                        key={status}
                        type='button'
                        disabled={isPending || status === feedback.status}
                        onClick={() => mutate({ id: feedback.id, status })}
                        className={cn(
                          'rounded-8 border px-12 py-8 text-noto-label-sm-bold whitespace-nowrap',
                          status === feedback.status
                            ? 'border-brand-primary bg-[#5A44F214] text-brand-primary'
                            : 'border-stroke-border-gray-stronger bg-white text-text-and-icon-primary disabled:opacity-40'
                        )}>
                        {FEEDBACK_STATUS_LABELS[status]}
                      </button>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
