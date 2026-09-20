'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table'
import type { PendingBrandDto } from '@/features/admin'

export type PendingBrandEdit = {
  name: string
  targetBrandId: string
}

type Props = {
  brand: PendingBrandDto
  selected: boolean
  edit: PendingBrandEdit
  onSelect: (selected: boolean) => void
  onEdit: (edit: PendingBrandEdit) => void
}

const inputClass =
  'h-40 w-full rounded-8 border border-stroke-border-gray-stronger bg-white px-12 text-noto-body-xs-normal text-text-and-icon-default outline-none focus:border-brand-primary'
const labelClass = 'text-noto-label-xs-bold text-text-and-icon-secondary'

/* 검수 대기 브랜드 1건. 승인 시 보낼 이름·병합 대상 ID는 부모(페이지)가 들고 있고
 * 여기서는 입력만 받는다 — 일괄 승인이 페이지 단위라서 */
export function PendingBrandCard({
  brand,
  selected,
  edit,
  onSelect,
  onEdit,
}: Props) {
  return (
    <section className='flex flex-col gap-16 rounded-16 bg-white p-24'>
      <div className='flex flex-wrap items-end gap-16'>
        <label className='flex items-center gap-8 pb-10 text-noto-label-sm-bold text-text-and-icon-secondary'>
          <input
            type='checkbox'
            checked={selected}
            onChange={(e) => onSelect(e.target.checked)}
            className='size-16 accent-brand-primary'
          />
          선택
        </label>
        <label className='flex w-[26rem] flex-col gap-6'>
          <span className={labelClass}>승인 Brand Name</span>
          <input
            value={edit.name}
            onChange={(e) => onEdit({ ...edit, name: e.target.value })}
            className={inputClass}
          />
        </label>
        <label className='flex w-[15rem] flex-col gap-6'>
          <span className={labelClass}>대상 Brand ID</span>
          <input
            type='number'
            inputMode='numeric'
            placeholder='병합 대상'
            value={edit.targetBrandId}
            onChange={(e) => onEdit({ ...edit, targetBrandId: e.target.value })}
            className={inputClass}
          />
        </label>
        <span className='pb-12 text-noto-label-sm-normal text-text-and-icon-secondary'>
          Brand ID {brand.id}
        </span>
      </div>

      <div className='overflow-hidden rounded-12 border border-stroke-border-gray-stronger'>
        <div className='border-b border-stroke-border-gray-stronger bg-background-gray-default px-16 py-12 text-noto-label-sm-bold text-text-and-icon-secondary'>
          생성 근거 영상
        </div>
        <Table>
          <TableHeader>
            <TableRow className='border-b border-stroke-border-gray-stronger'>
              <TableHead className='pl-24 text-left'>
                매칭 브랜드 명 (alias)
              </TableHead>
              <TableHead className='text-left'>매칭 브랜드 ID</TableHead>
              <TableHead className='text-left'>채널</TableHead>
              <TableHead className='text-left'>
                YouTube Video ID / URL
              </TableHead>
              <TableHead className='pr-24 text-left'>
                Video description
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {brand.videoEvidence.map((evidence) => (
              <TableRow
                key={evidence.channelBrandId}
                className='border-b border-stroke-border-gray-stronger last:border-b-0'>
                <TableCell className='pl-24 text-left text-brand-primary'>
                  {evidence.matchedAlias}
                </TableCell>
                <TableCell className='text-left text-text-and-icon-secondary'>
                  {evidence.channelBrandId}
                </TableCell>
                <TableCell className='text-left whitespace-nowrap'>
                  {evidence.channelName}
                </TableCell>
                <TableCell className='text-left'>
                  <div>Video ID: {evidence.youtubeVideoId}</div>
                  <a
                    href={evidence.youtubeVideoUrl}
                    target='_blank'
                    rel='noreferrer'
                    className='text-brand-primary underline'>
                    {evidence.youtubeVideoUrl}
                  </a>
                </TableCell>
                <TableCell className='max-w-[48rem] pr-24 text-left whitespace-pre-wrap text-text-and-icon-secondary'>
                  {evidence.videoDescription}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  )
}
