import { VideoTable, type VideoTableColumn } from '@/entities/channel/videoTable'
import type { NewInflowResponseDto } from '../model/types'
import { formatComma, formatPercent } from '@/shared/lib/format'

interface Props {
  data: NewInflowResponseDto[]
}

const COLUMNS: VideoTableColumn<NewInflowResponseDto>[] = [
  {
    label: '조회수',
    render: (item) => formatComma(item.viewCount),
  },
  {
    label: '신규 유입 비율',
    render: (item) => `${formatPercent(item.newSubscriberRatio)}%`,
  },
  {
    label: '구독 전환 수',
    render: (item) => formatComma(item.subscriptionConversionCount),
  },
  {
    label: '시청 유지율',
    render: (item) => `${formatPercent(item.retentionRate)}%`,
  },
]

export function NewInflow({ data }: Props) {
  return (
    <VideoTable data={data} getRowKey={(item) => item.videoId} columns={COLUMNS} />
  )
}
