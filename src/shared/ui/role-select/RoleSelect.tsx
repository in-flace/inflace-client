'use client'

import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group'
import { ROLE_LABEL, UserRole } from '@/entities/user'

import IconYoutuber from '@/shared/assets/IconYoutuber.png'
import IconMarketer from '@/shared/assets/IconMarketer.png'
import IconBrandManager from '@/shared/assets/IconBrandManager.png'
import IconMcnAgency from '@/shared/assets/IconMcnAgency.png'
import IconContentPlanner from '@/shared/assets/IconContentPlanner.png'
import IconEtc from '@/shared/assets/IconEtc.png'

const ROLE_OPTIONS = [
  {
    value: 'YOUTUBER' as UserRole,
    imgSrc: IconYoutuber,
    label: ROLE_LABEL.YOUTUBER,
  },
  {
    value: 'MARKETER' as UserRole,
    imgSrc: IconMarketer,
    label: ROLE_LABEL.MARKETER,
  },
  {
    value: 'BRAND_MANAGER' as UserRole,
    imgSrc: IconBrandManager,
    label: ROLE_LABEL.BRAND_MANAGER,
  },
  {
    value: 'MCN_AGENCY' as UserRole,
    imgSrc: IconMcnAgency,
    label: ROLE_LABEL.MCN_AGENCY,
  },
  {
    value: 'CONTENT_PLANNER' as UserRole,
    imgSrc: IconContentPlanner,
    label: ROLE_LABEL.CONTENT_PLANNER,
  },
  { value: 'ETC' as UserRole, imgSrc: IconEtc, label: ROLE_LABEL.ETC },
]

interface RoleSelectProps {
  value: UserRole[]
  onChange: (value: UserRole[]) => void
}

/* 유저의 직업 선택 UI - 온보딩, 마이페이지 사용 */
export function RoleSelect({ value, onChange }: RoleSelectProps) {
  return (
    <div className='flex h-fit w-full flex-col gap-32'>
      {/* 상단 문구 */}
      <div className='flex h-fit w-full flex-col gap-4'>
        <h4 className='text-noto-title-sm-normal text-text-and-icon-default'>
          어떤 일을 하시나요?
        </h4>
        <span className='mt-4 text-noto-caption-md-normal text-text-and-icon-tertiary'>
          맞춤 콘텐츠를 제공해드려요
        </span>
      </div>

      {/* 직업 선택 */}
      <ToggleGroup
        type='multiple'
        size='lg'
        value={value}
        onValueChange={(v: string[]) => onChange(v as UserRole[])}>
        {ROLE_OPTIONS.map((item) => (
          <ToggleGroupItem
            key={item.value}
            value={item.value}
            iconPosition='top'
            imgSrc={item.imgSrc.src}
            imgAlt={item.label}
            aria-label={item.label}>
            {item.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}
