import { create } from 'zustand'
import { User, Demand, Role, Status } from '@/lib/types'
import { MOCK_USERS, MOCK_DEMANDS } from '@/lib/mock-data'

interface AppState {
  currentUser: User | null
  users: User[]
  demands: Demand[]
  theme: 'light' | 'dark'
  setCurrentUser: (id: string) => void
  toggleTheme: () => void
  addDemand: (demand: Omit<Demand, 'id' | 'createdAt'>) => void
  updateDemandStatus: (id: string, status: Status) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentUser: MOCK_USERS[0], // Default to Director for full view
  users: MOCK_USERS,
  demands: MOCK_DEMANDS,
  theme: 'dark',
  setCurrentUser: (id) =>
    set((state) => ({ currentUser: state.users.find((u) => u.id === id) || state.currentUser })),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
  addDemand: (demand) =>
    set((state) => ({
      demands: [
        {
          ...demand,
          id: `d-${Date.now()}`,
          createdAt: new Date().toISOString(),
        },
        ...state.demands,
      ],
    })),
  updateDemandStatus: (id, status) =>
    set((state) => ({
      demands: state.demands.map((d) => (d.id === id ? { ...d, status } : d)),
    })),
}))
