'use client'

import { useMyProfile, useEditPreferencesModal, EditPreferencesModal } from '@/features/me'
import { ROLE_LABEL, NEED_LABEL } from '@/entities/user'
import { Button } from '@/shared/ui/button'

export function CustomInfoSection() {
  const { data } = useMyProfile()
  const openModal = useEditPreferencesModal((s) => s.open)
  const preferences = data?.preferences

  const roles = preferences?.roles.length
    ? preferences.roles.map((r) => ROLE_LABEL[r]).join(', ')
    : '-'
  const needs = preferences?.needs.length
    ? preferences.needs.map((n) => NEED_LABEL[n]).join(', ')
    : '-'

  const handleOpen = () => {
    openModal(preferences?.roles ?? [], preferences?.needs ?? [])
  }

  return (
    <>
      <div className='flex h-fit w-full gap-24 rounded-16 bg-white p-32 shadow-[0px_2px_6px_0px_#0D0D0D0A]'>
        {/* 좌측 정보 섹션 */}
        <div className='flex h-fit w-full flex-col gap-24'>
          <h2 className='text-noto-title-md-bold text-text-and-icon-primary'>
            맞춤 정보
          </h2>

          <div className='flex h-fit w-full flex-col gap-16'>
            <div className='flex h-fit w-full gap-20'>
              <h4 className='h-[2rem] w-[6rem] text-noto-body-xs-normal text-text-and-icon-secondary'>
                직업
              </h4>
              <span className='h-fit w-full text-noto-body-xs-normal text-text-and-icon-primary'>
                {roles}
              </span>
            </div>

            <div className='flex h-fit w-full gap-20'>
              <h4 className='h-[2rem] w-[6rem] text-noto-body-xs-normal text-text-and-icon-secondary'>
                관심사
              </h4>
              <span className='h-fit w-full text-noto-body-xs-normal text-text-and-icon-primary'>
                {needs}
              </span>
            </div>
          </div>
        </div>

        {/* 우측 변경하기 버튼 */}
        <Button color='secondary' variant='outlined' size='md' onClick={handleOpen}>
          변경하기
        </Button>
      </div>

      <EditPreferencesModal />
    </>
  )
}
