import { RoleSelect } from '@/shared/ui/role-select'
import { UserRole } from '@/entities/user'
import { useOnboardingModal } from '../model/useOnboardingModal'

export function OnboardingStep1() {
  const setSelection = useOnboardingModal((s) => s.setSelection)
  const selections = useOnboardingModal((s) => s.selections[1])

  return (
    <RoleSelect
      value={(selections as UserRole[]) ?? []}
      onChange={(value) => setSelection(1, value)}
    />
  )
}
