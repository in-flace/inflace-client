'use client'

import { cn } from '@/shared/lib/utils'

interface TabItem<T extends string> {
  id: T
  label: string
}

interface TabGroupProps<T extends string> {
  tabs: readonly TabItem<T>[]
  activeTab: T
  onTabChange: (id: T) => void
  type?: 'fill' | 'fit'
}

export function TabGroup<T extends string>({
  tabs,
  activeTab,
  onTabChange,
  type = 'fill',
}: TabGroupProps<T>) {
  return (
    <div
      className={cn(
        'flex h-fit overflow-x-auto rounded-12 bg-background-gray-stronger p-2',
        type === 'fill' ? 'w-full' : 'w-fit max-w-full'
      )}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type='button'
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'min-w-[14rem] shrink-0 rounded-12 py-16 text-noto-label-md-bold sm:text-noto-label-lg-bold',
            type === 'fill' ? 'flex-1' : 'w-fit px-16',
            activeTab === tab.id
              ? 'border-1 border-brand-primary bg-white text-brand-primary'
              : 'text-text-and-icon-secondary'
          )}>
          {tab.label}
        </button>
      ))}
    </div>
  )
}
