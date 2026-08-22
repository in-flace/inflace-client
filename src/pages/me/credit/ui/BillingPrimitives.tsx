'use client'

import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'
import {
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/shared/ui/shadcn/dialog'

export function StatusBadge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'success' | 'error' | 'warning' | 'neutral' | 'info'
}) {
  return (
    <span
      className={cn(
        'inline-flex h-24 shrink-0 items-center rounded-6 px-8 text-noto-label-xs-bold',
        tone === 'success' && 'bg-[rgba(0,118,60,0.1)] text-feedback-success',
        tone === 'error' && 'bg-[rgba(224,47,82,0.1)] text-feedback-error',
        tone === 'warning' && 'bg-[#FFF5D8] text-[#8A5A00]',
        tone === 'info' &&
          'bg-[rgba(36,115,230,0.1)] text-feedback-informative',
        tone === 'neutral' &&
          'bg-background-gray-stronger text-text-and-icon-secondary'
      )}>
      {children}
    </span>
  )
}

export function SectionCard({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'rounded-16 bg-white p-20 shadow-[0px_2px_6px_0px_#0D0D0D0A] sm:p-32',
        className
      )}>
      {children}
    </section>
  )
}

export function ModalContent({
  title,
  description,
  children,
  className,
}: {
  title: string
  description?: string
  children: ReactNode
  className?: string
}) {
  return (
    <DialogContent
      showCloseButton={false}
      overlayClassName='bg-background-dim-default'
      className={cn(
        'max-h-[calc(100dvh-3.2rem)] w-[calc(100vw-3.2rem)] max-w-none overflow-y-auto overscroll-contain rounded-16 bg-white p-24 shadow-none sm:max-w-none sm:p-40',
        className
      )}>
      <div className='flex flex-col gap-8'>
        <DialogTitle className='text-noto-title-sm-bold text-pretty text-text-and-icon-default'>
          {title}
        </DialogTitle>
        {description && (
          <DialogDescription className='text-noto-body-xs-normal text-pretty text-text-and-icon-secondary'>
            {description}
          </DialogDescription>
        )}
      </div>
      {children}
    </DialogContent>
  )
}
