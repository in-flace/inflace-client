import { VideoTable, type VideoTableColumn } from '@/entities/channel/videoTable'
import type { TypeEngagementVideoDto } from '../model/types'
import { formatPercent } from '@/shared/lib/format'

interface Props {
  data: TypeEngagementVideoDto[]
}

const COLUMNS: VideoTableColumn<TypeEngagementVideoDto>[] = [
  {
    label: '롱폼/숏폼',
    width: 'w-[12.4rem]',
    render: (item) => (item.contentType === 'LONG_FORM' ? '롱폼' : '숏폼'),
  },
  {
    label: '참여율',
    width: 'w-[14.8rem]',
    render: (item) => `${formatPercent(item.engagementRate)}%`,
  },
]

export function TypeEngagementList({ data }: Props) {
  return (
    <VideoTable data={data} getRowKey={(item) => item.rank} columns={COLUMNS} />
  )
}
