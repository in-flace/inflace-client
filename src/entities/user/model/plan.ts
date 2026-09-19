import type { UserPlan } from './types'

// PRO/EARLYBIRD는 결제 시기만 다른 동일한 유료 등급, ADMIN은 항상 통과
export function isPaidPlan(plan: UserPlan): boolean {
  return plan === 'PRO' || plan === 'EARLYBIRD' || plan === 'ADMIN'
}
