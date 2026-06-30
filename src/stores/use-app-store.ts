import { create } from 'zustand'
import { User, Demand, Status, ChatMessage } from '@/lib/types'
import { MOCK_USERS, MOCK_DEMANDS } from '@/lib/mock-data'

interface AppState {
  currentUser: User | null
  isAuthenticated: boolean
  users: User[]
  demands: Demand[]
  theme: 'light' | 'dark'
  chatMessages: ChatMessage[]
  login: (email: string, password: string) => boolean
  logout: () => void
  setCurrentUser: (id: string) => void
  toggleTheme: () => void
  addDemand: (demand: Omit<Demand, 'id' | 'createdAt'>) => void
  updateDemandStatus: (id: string, status: Status) => void
  addChatMessage: (message: ChatMessage) => void
  confirmChatTasks: (messageId: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentUser: null,
  isAuthenticated: false,
  users: MOCK_USERS,
  demands: MOCK_DEMANDS,
  theme: 'dark',
  chatMessages: [],
  login: (email, password) => {
    const user = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
    )
    if (user) {
      set({ currentUser: user, isAuthenticated: true })
      return true
    }
    return false
  },
  logout: () => set({ currentUser: null, isAuthenticated: false, chatMessages: [] }),
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
  addChatMessage: (message) => set((state) => ({ chatMessages: [...state.chatMessages, message] })),
  confirmChatTasks: (messageId) =>
    set((state) => ({
      chatMessages: state.chatMessages.map((m) =>
        m.id === messageId ? { ...m, confirmed: true } : m,
      ),
    })),
}))
