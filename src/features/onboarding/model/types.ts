import { StaticImageData } from 'next/image'

export type { UserRole, Need } from '@/entities/user'

export interface OnboardingModalState {
  isOpen: boolean
  step: number
  featureIndex: number
  selections: Record<number, string | string[]>
  open: () => void
  close: () => void
  nextStep: () => void
  prevStep: () => void
  nextFeature: () => void
  setSelection: (step: number, value: string | string[]) => void
}
export interface OptionItem {
  value: string
  imgSrc: StaticImageData
  label: string
}

export interface FeatureSlide {
  title: string
  desc: string
  image: StaticImageData
}
