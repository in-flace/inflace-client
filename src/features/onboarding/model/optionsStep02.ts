import { NEED_LABEL } from '@/entities/user'
import { OptionItem } from './types'

import IconChannelAnalysis from '../assets/IconChannelAnalysis.png'
import IconInfluencerSearch from '../assets/IconInfluencerSearch.png'
import IconYoutubeContentSearch from '../assets/IconYoutubeContentSearch.png'
import IconFakeSubscriberDetect from '../assets/IconFakeSubscriberDetect.png'
import IconCompetitorBenchmark from '../assets/IconCompetitorBenchmark.png'
import IconCollabProposal from '../assets/IconCollabProposal.png'
import IconInsightMagazine from '../assets/IconInsightMagazine.png'

export const CHANNEL_ANALYSIS_VALUE = 'CHANNEL_ANALYSIS'

export const OPTION_ITEM: OptionItem[] = [
  { value: CHANNEL_ANALYSIS_VALUE, imgSrc: IconChannelAnalysis, label: NEED_LABEL.CHANNEL_ANALYSIS },
  { value: 'INFLUENCER_SEARCH', imgSrc: IconInfluencerSearch, label: NEED_LABEL.INFLUENCER_SEARCH },
  { value: 'YOUTUBE_CONTENT_SEARCH', imgSrc: IconYoutubeContentSearch, label: NEED_LABEL.YOUTUBE_CONTENT_SEARCH },
  { value: 'FAKE_SUBSCRIBER_DETECT', imgSrc: IconFakeSubscriberDetect, label: NEED_LABEL.FAKE_SUBSCRIBER_DETECT },
  { value: 'COMPETITOR_BENCHMARK', imgSrc: IconCompetitorBenchmark, label: NEED_LABEL.COMPETITOR_BENCHMARK },
  { value: 'COLLAB_PROPOSAL', imgSrc: IconCollabProposal, label: NEED_LABEL.COLLAB_PROPOSAL },
  { value: 'INSIGHT_MAGAZINE', imgSrc: IconInsightMagazine, label: NEED_LABEL.INSIGHT_MAGAZINE },
]
