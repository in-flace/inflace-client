import { NeedSelect } from '@/shared/ui/need-select'
import { Need } from '@/entities/user'
import { useOnboardingModal } from '../model/useOnboardingModal'

export function OnboardingStep2() {
  const setSelection = useOnboardingModal((s) => s.setSelection)
  const selections = useOnboardingModal((s) => s.selections[2])

  return (
    <NeedSelect
      value={(selections as Need[]) ?? []}
      onChange={(value) => setSelection(2, value)}
    />
  )
}
