import { VideoTable, type VideoTableColumn } from '@/entities/channel/videoTable'
import type { TrendingVideoResponseDto } from '../model/types'
import { formatComma, formatPercent } from '@/shared/lib/format'

interface Props {
  data: TrendingVideoResponseDto[]
}

const COLUMNS: VideoTableColumn<TrendingVideoResponseDto>[] = [
  {
    label: '조회수',
    render: (item) => formatComma(item.viewCount),
  },
  {
    label: '참여율',
    render: (item) => `${formatPercent(item.engagementRate)}%`,
  },
  {
    label: 'CTR',
    render: (item) => `${formatPercent(item.ctr)}%`,
  },
  {
    label: '시청 유지율',
    render: (item) => `${formatPercent(item.retentionRate)}%`,
  },
]

export function TrendingVideo({ data }: Props) {
  return (
    <VideoTable data={data} getRowKey={(item) => item.videoId} columns={COLUMNS} />
  )
}
