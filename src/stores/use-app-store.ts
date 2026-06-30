import { create } from 'zustand'
import { User, Demand, Status, Priority, ChatMessage, Comment } from '@/lib/types'
import { MOCK_USERS, MOCK_DEMANDS } from '@/lib/mock-data'

interface AppState {
  currentUser: User | null
  isAuthenticated: boolean
  users: User[]
  demands: Demand[]
  theme: 'light' | 'dark'
  chatMessages: ChatMessage[]
  login: (email: string, password: string) => boolean
  microsoftLogin: () => boolean
  logout: () => void
  setCurrentUser: (id: string) => void
  toggleTheme: () => void
  addDemand: (demand: Omit<Demand, 'id' | 'createdAt'>) => void
  updateDemandStatus: (id: string, status: Status) => void
  updateDemandPriority: (id: string, priority: Priority) => void
  addComment: (demandId: string, text: string, authorId: string, authorName: string) => void
  addChatMessage: (message: ChatMessage) => void
  confirmChatTasks: (messageId: string) => void
  addUser: (user: Omit<User, 'id'>) => void
  updateUser: (id: string, updates: Partial<User>) => void
  deleteUser: (id: string) => void
}

const getInitialTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'dark'
  const stored = localStorage.getItem('demandflow-theme')
  return stored === 'light' ? 'light' : 'dark'
}

export const useAppStore = create<AppState>((set) => ({
  currentUser: null,
  isAuthenticated: false,
  users: MOCK_USERS,
  demands: MOCK_DEMANDS,
  theme: getInitialTheme(),
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

  microsoftLogin: () => {
    const user = MOCK_USERS.find((u) => u.microsoftId)
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
        { ...demand, id: `d-${Date.now()}`, createdAt: new Date().toISOString() },
        ...state.demands,
      ],
    })),

  updateDemandStatus: (id, status) =>
    set((state) => ({ demands: state.demands.map((d) => (d.id === id ? { ...d, status } : d)) })),

  updateDemandPriority: (id, priority) =>
    set((state) => ({ demands: state.demands.map((d) => (d.id === id ? { ...d, priority } : d)) })),

  addComment: (demandId, text, authorId, authorName) =>
    set((state) => {
      const comment: Comment = {
        id: `c-${Date.now()}`,
        demandId,
        authorId,
        authorName,
        text,
        timestamp: new Date().toISOString(),
      }
      return {
        demands: state.demands.map((d) =>
          d.id === demandId ? { ...d, comments: [...(d.comments || []), comment] } : d,
        ),
      }
    }),

  addChatMessage: (message) => set((state) => ({ chatMessages: [...state.chatMessages, message] })),

  confirmChatTasks: (messageId) =>
    set((state) => ({
      chatMessages: state.chatMessages.map((m) =>
        m.id === messageId ? { ...m, confirmed: true } : m,
      ),
    })),

  addUser: (user) =>
    set((state) => ({ users: [...state.users, { ...user, id: `u-${Date.now()}` }] })),

  updateUser: (id, updates) =>
    set((state) => ({
      users: state.users.map((u) => (u.id === id ? { ...u, ...updates } : u)),
      currentUser:
        state.currentUser?.id === id ? { ...state.currentUser, ...updates } : state.currentUser,
    })),

  deleteUser: (id) =>
    set((state) => ({
      users: state.users.filter((u) => u.id !== id),
      demands: state.demands.filter((d) => d.assigneeId !== id),
    })),
}))
