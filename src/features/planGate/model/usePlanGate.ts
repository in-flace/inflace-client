import { useAuthStore, isPaidPlan } from '@/entities/user'
import type { UserPlan } from '@/entities/user'

export function usePlanGate() {
  const user = useAuthStore((s) => s.user)
  const userPlan: UserPlan = (user?.userDetails.plan as UserPlan) ?? 'FREE'
  const isLocked = !isPaidPlan(userPlan)
  return { isLocked }
}
