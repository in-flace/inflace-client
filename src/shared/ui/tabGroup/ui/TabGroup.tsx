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
  scrollable?: boolean
}

export function TabGroup<T extends string>({
  tabs,
  activeTab,
  onTabChange,
  type = 'fill',
  scrollable = false,
}: TabGroupProps<T>) {
  return (
    <div
      className={cn(
        'flex h-fit rounded-12 bg-background-gray-stronger p-2',
        type === 'fill' ? 'w-full' : 'w-fit',
        scrollable && 'max-w-full overflow-x-auto'
      )}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type='button'
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'rounded-12 py-16',
            type === 'fill' ? 'flex-1' : 'w-fit px-16',
            scrollable
              ? 'min-w-[14rem] shrink-0 text-noto-label-md-bold sm:text-noto-label-lg-bold'
              : 'text-noto-label-lg-bold',
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
