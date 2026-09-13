import { create } from 'zustand'
import type { UserRole, Need } from '@/entities/user'

interface EditPreferencesModalState {
  isOpen: boolean
  step: 1 | 2
  roles: UserRole[]
  needs: Need[]
  open: (initialRoles: UserRole[], initialNeeds: Need[]) => void
  close: () => void
  nextStep: () => void
  prevStep: () => void
  setRoles: (roles: UserRole[]) => void
  setNeeds: (needs: Need[]) => void
}

export const useEditPreferencesModal = create<EditPreferencesModalState>(
  (set) => ({
    isOpen: false,
    step: 1,
    roles: [],
    needs: [],
    open: (initialRoles, initialNeeds) =>
      set({ isOpen: true, step: 1, roles: initialRoles, needs: initialNeeds }),
    close: () => set({ isOpen: false, step: 1 }),
    nextStep: () => set({ step: 2 }),
    prevStep: () => set({ step: 1 }),
    setRoles: (roles) => set({ roles }),
    setNeeds: (needs) => set({ needs }),
  })
)
