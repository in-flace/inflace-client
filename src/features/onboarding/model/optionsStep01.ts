import { ROLE_LABEL } from '@/entities/user'
import { OptionItem } from './types'

import IconYoutuber from '../assets/IconYoutuber.png'
import IconMarketer from '../assets/IconMarketer.png'
import IconBrandManager from '../assets/IconBrandManager.png'
import IconMcnAgency from '../assets/IconMcnAgency.png'
import IconContentPlanner from '../assets/IconContentPlanner.png'
import IconEtc from '../assets/IconEtc.png'

export const OPTION_ITEM: OptionItem[] = [
  { value: 'YOUTUBER', imgSrc: IconYoutuber, label: ROLE_LABEL.YOUTUBER },
  { value: 'MARKETER', imgSrc: IconMarketer, label: ROLE_LABEL.MARKETER },
  { value: 'BRAND_MANAGER', imgSrc: IconBrandManager, label: ROLE_LABEL.BRAND_MANAGER },
  { value: 'MCN_AGENCY', imgSrc: IconMcnAgency, label: ROLE_LABEL.MCN_AGENCY },
  { value: 'CONTENT_PLANNER', imgSrc: IconContentPlanner, label: ROLE_LABEL.CONTENT_PLANNER },
  { value: 'ETC', imgSrc: IconEtc, label: ROLE_LABEL.ETC },
]
